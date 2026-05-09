using examxy.Application.Exceptions;
using examxy.Application.Features.QuestionBank;
using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Application.Features.PaperExams;
using examxy.Domain.QuestionBank;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace examxy.Infrastructure.Features.QuestionBank
{
    public sealed class QuestionBankService : IQuestionBankService
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
        private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/png",
            "image/jpeg",
            "image/webp"
        };

        private readonly AppDbContext _dbContext;
        private readonly IPaperExamStorage _storage;
        private readonly IQuestionBankAttachmentStorage _attachmentStorage;

        public QuestionBankService(
            AppDbContext dbContext,
            IPaperExamStorage storage,
            IQuestionBankAttachmentStorage attachmentStorage)
        {
            _dbContext = dbContext;
            _storage = storage;
            _attachmentStorage = attachmentStorage;
        }

        public async Task<QuestionDto> CreateQuestionAsync(
            string teacherUserId,
            CreateQuestionRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var normalized = QuestionContentNormalizer.Normalize(request);

            var now = DateTime.UtcNow;
            var question = new QuestionBankQuestion
            {
                Id = Guid.NewGuid(),
                OwnerTeacherUserId = teacherUserId,
                Code = await GenerateUniqueQuestionCodeAsync(teacherUserId, cancellationToken),
                CurrentVersionNumber = 1,
                Status = QuestionStatus.Active,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            var versionId = Guid.NewGuid();
            var attachmentIds = ExtractReferencedAttachmentIds(normalized.ContentJson)
                .Concat(request.Media.Select(media => media.AttachmentId))
                .Distinct()
                .ToArray();
            var referencedAttachments = await ValidateReferencedAttachmentsAsync(
                teacherUserId,
                attachmentIds,
                cancellationToken);

            question.Versions.Add(new QuestionBankQuestionVersion
            {
                Id = versionId,
                QuestionId = question.Id,
                VersionNumber = 1,
                QuestionType = normalized.QuestionType,
                StemRichText = normalized.StemRichText,
                StemPlainText = normalized.StemPlainText,
                ExplanationRichText = normalized.ExplanationRichText,
                Difficulty = normalized.Difficulty,
                EstimatedSeconds = normalized.EstimatedSeconds,
                ContentSchemaVersion = normalized.ContentSchemaVersion,
                AnswerKeySchemaVersion = normalized.AnswerKeySchemaVersion,
                RendererVersion = normalized.RendererVersion,
                ContentJson = normalized.ContentJson,
                AnswerKeyJson = normalized.AnswerKeyJson,
                ExplanationJson = normalized.ExplanationJson,
                SearchText = normalized.SearchText,
                CreatedByUserId = teacherUserId,
                CreatedAtUtc = now,
                Attachments = request.Attachments.Select(attachment => new QuestionBankAttachment
                {
                    Id = Guid.NewGuid(),
                    QuestionVersionId = versionId,
                    OwnerTeacherUserId = teacherUserId,
                    QuestionId = question.Id,
                    FileName = attachment.FileName.Trim(),
                    OriginalFileName = string.IsNullOrWhiteSpace(attachment.OriginalFileName)
                        ? attachment.FileName.Trim()
                        : attachment.OriginalFileName.Trim(),
                    ContentType = attachment.ContentType.Trim(),
                    FileSizeBytes = attachment.FileSizeBytes,
                    StorageProvider = string.IsNullOrWhiteSpace(attachment.StorageProvider) ? "ExternalUrl" : attachment.StorageProvider.Trim(),
                    StorageKey = attachment.StorageKey.Trim(),
                    ExternalUrl = attachment.ExternalUrl.Trim(),
                    Status = "Attached",
                    CreatedAtUtc = now
                }).ToList()
            });

            AttachReferencedUploads(referencedAttachments, question.Id, versionId, now);

            _dbContext.QuestionBankQuestions.Add(question);
            await _dbContext.SaveChangesAsync(cancellationToken);

            await UpsertTagsAsync(
                question.Id,
                teacherUserId,
                request.Tags,
                cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);
            return await GetQuestionAsync(teacherUserId, question.Id, cancellationToken);
        }

        public async Task<IReadOnlyCollection<QuestionDto>> GetQuestionsAsync(
            string teacherUserId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);

            var questions = await _dbContext.QuestionBankQuestions
                .Include(question => question.Versions)
                    .ThenInclude(version => version.Attachments)
                .Include(question => question.QuestionTags)
                    .ThenInclude(join => join.Tag)
                .Where(question =>
                    question.OwnerTeacherUserId == teacherUserId &&
                    question.DeletedAtUtc == null)
                .OrderByDescending(question => question.UpdatedAtUtc)
                .ToArrayAsync(cancellationToken);

            return questions.Select(MapQuestion).ToArray();
        }

        public async Task<QuestionBankPagedResultDto> SearchQuestionsAsync(
            string teacherUserId,
            QuestionBankQueryDto query,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);

            var questions = await _dbContext.QuestionBankQuestions
                .Include(question => question.Versions)
                    .ThenInclude(version => version.Attachments)
                .Include(question => question.QuestionTags)
                    .ThenInclude(join => join.Tag)
                .Where(question =>
                    question.OwnerTeacherUserId == teacherUserId &&
                    question.DeletedAtUtc == null)
                .OrderByDescending(question => question.UpdatedAtUtc)
                .ToArrayAsync(cancellationToken);

            var filtered = questions.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                filtered = filtered.Where(question => string.Equals(question.Status.ToString(), query.Status, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Type))
            {
                filtered = filtered.Where(question => GetCurrentVersion(question)?.QuestionType.ToString().Equals(query.Type, StringComparison.OrdinalIgnoreCase) == true);
            }

            if (!string.IsNullOrWhiteSpace(query.Difficulty))
            {
                filtered = filtered.Where(question => string.Equals(GetCurrentVersion(question)?.Difficulty, query.Difficulty, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Tag))
            {
                filtered = filtered.Where(question => question.QuestionTags.Any(join => string.Equals(join.Tag.Name, query.Tag, StringComparison.OrdinalIgnoreCase)));
            }

            if (query.SchemaVersion.HasValue)
            {
                filtered = filtered.Where(question => GetCurrentVersion(question)?.ContentSchemaVersion == query.SchemaVersion.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Query))
            {
                var normalizedQuery = query.Query.Trim().ToUpperInvariant();
                filtered = filtered.Where(question =>
                {
                    var currentVersion = GetCurrentVersion(question);
                    var haystack = string.Join(
                        ' ',
                        question.Code,
                        question.Status,
                        currentVersion?.StemPlainText,
                        currentVersion?.SearchText,
                        string.Join(' ', question.QuestionTags.Select(join => join.Tag.Name))).ToUpperInvariant();
                    return haystack.Contains(normalizedQuery, StringComparison.Ordinal);
                });
            }

            filtered = ApplyFeatureFlagFilter(filtered, query.HasMath, "latex");
            filtered = ApplyFeatureFlagFilter(filtered, query.HasMedia, "attachmentId");
            filtered = ApplyFeatureFlagFilter(filtered, query.HasGraph, "graphType");

            var filteredArray = filtered.ToArray();
            var page = Math.Max(query.Page, 1);
            var pageSize = Math.Clamp(query.PageSize, 1, 100);

            return new QuestionBankPagedResultDto
            {
                Items = filteredArray
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(MapQuestion)
                    .ToArray(),
                Page = page,
                PageSize = pageSize,
                TotalCount = filteredArray.Length,
                Facets = new QuestionBankFacetsDto
                {
                    Types = questions.Select(question => GetCurrentVersion(question)?.QuestionType.ToString() ?? string.Empty)
                        .Where(value => !string.IsNullOrWhiteSpace(value))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(value => value)
                        .ToArray(),
                    Tags = questions.SelectMany(question => question.QuestionTags.Select(join => join.Tag.Name))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(value => value)
                        .ToArray(),
                    Difficulties = questions.Select(question => GetCurrentVersion(question)?.Difficulty ?? string.Empty)
                        .Where(value => !string.IsNullOrWhiteSpace(value))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(value => value)
                        .ToArray()
                }
            };
        }

        public async Task<QuestionDto> GetQuestionAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);

            var question = await _dbContext.QuestionBankQuestions
                .Include(candidate => candidate.Versions)
                    .ThenInclude(version => version.Attachments)
                .Include(candidate => candidate.QuestionTags)
                    .ThenInclude(join => join.Tag)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == questionId &&
                        candidate.OwnerTeacherUserId == teacherUserId &&
                        candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (question is null)
            {
                throw new NotFoundException("Question not found.");
            }

            return MapQuestion(question);
        }

        public async Task<IReadOnlyCollection<QuestionVersionDto>> GetQuestionVersionsAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken = default)
        {
            var question = await LoadTeacherQuestionAsync(teacherUserId, questionId, cancellationToken);
            return question.Versions
                .OrderByDescending(version => version.VersionNumber)
                .Select(MapVersion)
                .ToArray();
        }

        public async Task<QuestionVersionDto> GetQuestionVersionAsync(
            string teacherUserId,
            Guid questionId,
            int versionNumber,
            CancellationToken cancellationToken = default)
        {
            var question = await LoadTeacherQuestionAsync(teacherUserId, questionId, cancellationToken);
            var version = question.Versions.FirstOrDefault(candidate => candidate.VersionNumber == versionNumber);
            if (version is null)
            {
                throw new NotFoundException("Question version not found.");
            }

            return MapVersion(version);
        }

        public async Task<QuestionDto> UpdateQuestionAsync(
            string teacherUserId,
            Guid questionId,
            UpdateQuestionRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var normalized = QuestionContentNormalizer.Normalize(request);

            var question = await _dbContext.QuestionBankQuestions
                .Include(candidate => candidate.Versions)
                    .ThenInclude(version => version.Attachments)
                .Include(candidate => candidate.QuestionTags)
                    .ThenInclude(join => join.Tag)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == questionId &&
                        candidate.OwnerTeacherUserId == teacherUserId &&
                        candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (question is null)
            {
                throw new NotFoundException("Question not found.");
            }

            var now = DateTime.UtcNow;
            var nextVersionNumber = question.CurrentVersionNumber + 1;
            var nextVersionId = Guid.NewGuid();
            var attachmentIds = ExtractReferencedAttachmentIds(normalized.ContentJson)
                .Concat(request.Media.Select(media => media.AttachmentId))
                .Distinct()
                .ToArray();
            var referencedAttachments = await ValidateReferencedAttachmentsAsync(
                teacherUserId,
                attachmentIds,
                cancellationToken);

            var nextVersion = new QuestionBankQuestionVersion
            {
                Id = nextVersionId,
                QuestionId = question.Id,
                VersionNumber = nextVersionNumber,
                QuestionType = normalized.QuestionType,
                StemRichText = normalized.StemRichText,
                StemPlainText = normalized.StemPlainText,
                ExplanationRichText = normalized.ExplanationRichText,
                Difficulty = normalized.Difficulty,
                EstimatedSeconds = normalized.EstimatedSeconds,
                ContentSchemaVersion = normalized.ContentSchemaVersion,
                AnswerKeySchemaVersion = normalized.AnswerKeySchemaVersion,
                RendererVersion = normalized.RendererVersion,
                ContentJson = normalized.ContentJson,
                AnswerKeyJson = normalized.AnswerKeyJson,
                ExplanationJson = normalized.ExplanationJson,
                SearchText = normalized.SearchText,
                CreatedByUserId = teacherUserId,
                CreatedAtUtc = now,
                Attachments = request.Attachments.Select(attachment => new QuestionBankAttachment
                {
                    Id = Guid.NewGuid(),
                    QuestionVersionId = nextVersionId,
                    OwnerTeacherUserId = teacherUserId,
                    QuestionId = question.Id,
                    FileName = attachment.FileName.Trim(),
                    OriginalFileName = string.IsNullOrWhiteSpace(attachment.OriginalFileName)
                        ? attachment.FileName.Trim()
                        : attachment.OriginalFileName.Trim(),
                    ContentType = attachment.ContentType.Trim(),
                    FileSizeBytes = attachment.FileSizeBytes,
                    StorageProvider = string.IsNullOrWhiteSpace(attachment.StorageProvider) ? "ExternalUrl" : attachment.StorageProvider.Trim(),
                    StorageKey = attachment.StorageKey.Trim(),
                    ExternalUrl = attachment.ExternalUrl.Trim(),
                    Status = "Attached",
                    CreatedAtUtc = now
                }).ToList()
            };
            AttachReferencedUploads(referencedAttachments, question.Id, nextVersionId, now);

            question.Status = ParseQuestionStatus(request.Status);
            question.CurrentVersionNumber = nextVersionNumber;
            question.UpdatedAtUtc = now;
            _dbContext.QuestionBankQuestionVersions.Add(nextVersion);

            await UpsertTagsAsync(
                question.Id,
                teacherUserId,
                request.Tags,
                cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);
            return await GetQuestionAsync(teacherUserId, question.Id, cancellationToken);
        }

        public async Task DeleteQuestionAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);

            var question = await _dbContext.QuestionBankQuestions
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == questionId &&
                        candidate.OwnerTeacherUserId == teacherUserId &&
                        candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (question is null)
            {
                throw new NotFoundException("Question not found.");
            }

            question.Status = QuestionStatus.Archived;
            question.DeletedAtUtc = DateTime.UtcNow;
            question.UpdatedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public QuestionBankCapabilitiesDto GetCapabilities()
        {
            return new QuestionBankCapabilitiesDto
            {
                SupportedQuestionTypes = Enum.GetNames<QuestionType>(),
                SupportedContentBlocks = new[]
                {
                    "paragraph",
                    "mathInline",
                    "mathBlock",
                    "image",
                    "graph",
                    "table",
                    "code"
                },
                Latex = new LatexCapabilitiesDto
                {
                    Enabled = true,
                    AllowInlineMath = true,
                    AllowDisplayMath = true
                },
                Attachments = new AttachmentCapabilitiesDto
                {
                    MaxImageSizeBytes = 5 * 1024 * 1024,
                    AllowedImageContentTypes = new[] { "image/png", "image/jpeg", "image/webp" }
                }
            };
        }

        public async Task<PreviewLatexResponseDto> PreviewLatexAsync(
            string teacherUserId,
            PreviewLatexRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            NormalizedQuestionContent normalized;
            try
            {
                normalized = QuestionContentNormalizer.Normalize(request.Question);
            }
            catch (QuestionBankContentValidationException exception)
            {
                return new PreviewLatexResponseDto
                {
                    Errors = MapValidationDiagnostics(exception.Errors)
                };
            }

            var version = new QuestionBankQuestionVersion
            {
                Id = Guid.NewGuid(),
                QuestionId = Guid.NewGuid(),
                VersionNumber = 1,
                QuestionType = normalized.QuestionType,
                StemRichText = normalized.StemRichText,
                StemPlainText = normalized.StemPlainText,
                ExplanationRichText = normalized.ExplanationRichText,
                Difficulty = normalized.Difficulty,
                EstimatedSeconds = normalized.EstimatedSeconds,
                ContentSchemaVersion = normalized.ContentSchemaVersion,
                AnswerKeySchemaVersion = normalized.AnswerKeySchemaVersion,
                RendererVersion = normalized.RendererVersion,
                ContentJson = normalized.ContentJson,
                AnswerKeyJson = normalized.AnswerKeyJson,
                ExplanationJson = normalized.ExplanationJson,
                SearchText = normalized.SearchText,
                CreatedByUserId = teacherUserId,
                CreatedAtUtc = DateTime.UtcNow
            };
            var attachmentIds = ExtractReferencedAttachmentIds(normalized.ContentJson)
                .Concat(request.Question.Media.Select(media => media.AttachmentId))
                .Distinct()
                .ToArray();
            var attachments = await _dbContext.QuestionBankAttachments
                .Where(attachment =>
                    attachmentIds.Contains(attachment.Id) &&
                    attachment.OwnerTeacherUserId == teacherUserId)
                .ToDictionaryAsync(attachment => attachment.Id, cancellationToken);

            var rendered = QuestionLatexRenderer.Render(
                version,
                request.IncludeAnswers,
                request.IncludeExplanations,
                attachments);
            return new PreviewLatexResponseDto
            {
                Latex = rendered.Fragment,
                LatexFragment = rendered.Fragment,
                Warnings = rendered.Warnings,
                Errors = rendered.Errors
            };
        }

        public async Task<PreviewQuestionImportResponseDto> PreviewQuestionImportAsync(
            string teacherUserId,
            PreviewQuestionImportRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var parsed = QuestionBankImportParser.Parse(request);
            if (parsed.Errors.Count > 0)
            {
                return parsed;
            }

            try
            {
                var normalized = QuestionContentNormalizer.Normalize(parsed.Draft);
                parsed.Draft.StemPlainText = normalized.StemPlainText;
                parsed.Draft.StemRichText = normalized.StemRichText;
                parsed.Draft.ExplanationRichText = normalized.ExplanationRichText;
                parsed.Draft.ContentJson = normalized.ContentJson;
                parsed.Draft.AnswerKeyJson = normalized.AnswerKeyJson;
            }
            catch (QuestionBankContentValidationException exception)
            {
                parsed.Warnings = parsed.Warnings
                    .Concat(exception.Errors.SelectMany(error => error.Value.Select(message => new QuestionBankImportDiagnosticDto
                    {
                        Code = "QuestionContentInvalid",
                        Message = message,
                        Path = error.Key
                    })))
                    .ToArray();
                parsed.Status = "ParsedWithWarnings";
            }

            return parsed;
        }

        public async Task<QuestionBankExportJobDto> CreatePdfExportAsync(
            string teacherUserId,
            CreateQuestionBankExportRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            if (request.QuestionVersionIds.Count == 0)
            {
                throw new ValidationException("Question versions are required.", new Dictionary<string, string[]>
                {
                    ["questionVersionIds"] = new[] { "Select at least one question version." }
                });
            }

            var versions = await _dbContext.QuestionBankQuestionVersions
                .Include(version => version.Question)
                .Where(version =>
                    request.QuestionVersionIds.Contains(version.Id) &&
                    version.Question.OwnerTeacherUserId == teacherUserId &&
                    version.Question.DeletedAtUtc == null)
                .ToArrayAsync(cancellationToken);
            var orderedVersions = request.QuestionVersionIds
                .Select(id => versions.FirstOrDefault(version => version.Id == id))
                .Where(version => version is not null)
                .Select(version => version!)
                .ToArray();

            if (orderedVersions.Length != request.QuestionVersionIds.Count)
            {
                throw new NotFoundException("One or more question versions were not found.");
            }

            var options = request.Options ?? new QuestionBankExportOptionsDto();
            var now = DateTime.UtcNow;
            var job = new QuestionBankExportJob
            {
                Id = Guid.NewGuid(),
                OwnerTeacherUserId = teacherUserId,
                Title = string.IsNullOrWhiteSpace(request.Title) ? "Question Bank Export" : request.Title.Trim(),
                Description = request.Description?.Trim() ?? string.Empty,
                Status = QuestionBankExportJobStatus.Queued,
                TemplateId = string.IsNullOrWhiteSpace(options.TemplateId) ? "default-vietnamese-exam" : options.TemplateId.Trim(),
                OptionsJson = JsonSerializer.Serialize(options, JsonOptions),
                QuestionCount = orderedVersions.Length,
                GeneratedLatexStorageKey = string.Empty,
                PdfStorageKey = string.Empty,
                CompileLogStorageKey = string.Empty,
                ErrorJson = "[]",
                CreatedAtUtc = now,
                Items = orderedVersions.Select((version, index) => new QuestionBankExportJobItem
                {
                    Id = Guid.NewGuid(),
                    QuestionBankQuestionId = version.QuestionId,
                    QuestionBankQuestionVersionId = version.Id,
                    OrderIndex = index,
                    RenderedLatexFragment = string.Empty,
                    WarningsJson = "[]"
                }).ToArray()
            };

            _dbContext.QuestionBankExportJobs.Add(job);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return MapExportJob(job);
        }
        public async Task<QuestionBankExportJobDto> GetExportJobAsync(
            string teacherUserId,
            Guid exportJobId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var job = await _dbContext.QuestionBankExportJobs
                .Include(candidate => candidate.Files)
                .Include(candidate => candidate.Items)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == exportJobId &&
                        candidate.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (job is null)
            {
                throw new NotFoundException("Question bank export job not found.");
            }

            return MapExportJob(job);
        }

        public async Task<QuestionBankAttachmentFileDto> OpenExportFileAsync(
            string teacherUserId,
            Guid exportJobId,
            Guid fileId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var file = await _dbContext.QuestionBankExportFiles
                .Include(candidate => candidate.ExportJob)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == fileId &&
                        candidate.ExportJobId == exportJobId &&
                        candidate.ExportJob.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (file is null)
            {
                throw new NotFoundException("Question bank export file not found.");
            }

            if (string.IsNullOrWhiteSpace(file.StorageKey))
            {
                throw new NotFoundException("Question bank export file is not available.");
            }

            var storedFile = await _storage.OpenReadAsync(file.StorageKey, cancellationToken);
            return new QuestionBankAttachmentFileDto
            {
                Content = storedFile.Content,
                FileName = string.IsNullOrWhiteSpace(file.FileName) ? storedFile.FileName : file.FileName,
                ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? storedFile.ContentType : file.ContentType
            };
        }

        public async Task<CreateQuestionBankAttachmentUploadUrlResponseDto> CreateAttachmentUploadUrlAsync(
            string teacherUserId,
            CreateQuestionBankAttachmentUploadUrlRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            ValidateAttachmentUploadRequest(request);

            var now = DateTime.UtcNow;
            var attachment = new QuestionBankAttachment
            {
                Id = Guid.NewGuid(),
                OwnerTeacherUserId = teacherUserId,
                FileName = NormalizeFileName(request.FileName),
                OriginalFileName = NormalizeFileName(request.FileName),
                ContentType = request.ContentType.Trim(),
                FileSizeBytes = request.FileSizeBytes,
                StorageProvider = "Local",
                StorageKey = string.Empty,
                ExternalUrl = string.Empty,
                PublicUrl = string.Empty,
                ContentHash = string.Empty,
                Status = "PendingUpload",
                CreatedAtUtc = now
            };

            _dbContext.QuestionBankAttachments.Add(attachment);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new CreateQuestionBankAttachmentUploadUrlResponseDto
            {
                AttachmentId = attachment.Id,
                UploadUrl = $"/api/question-bank/attachments/complete",
                Method = "POST",
                Headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["Content-Type"] = "application/json"
                },
                Attachment = MapAttachment(attachment)
            };
        }

        public async Task<QuestionAttachmentDto> CompleteAttachmentUploadAsync(
            string teacherUserId,
            CompleteQuestionBankAttachmentUploadRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var attachment = await LoadTeacherAttachmentAsync(teacherUserId, request.AttachmentId, cancellationToken);
            if (attachment.Status != "PendingUpload")
            {
                throw new ConflictException("Attachment is not pending upload.");
            }

            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(request.Base64Content);
            }
            catch (FormatException exception)
            {
                throw new ValidationException(
                    "Attachment content is invalid.",
                    new Dictionary<string, string[]>
                    {
                        ["base64Content"] = new[] { "Base64 content is invalid." }
                    },
                    exception);
            }

            if (bytes.Length == 0 || bytes.LongLength != attachment.FileSizeBytes)
            {
                throw new ValidationException(
                    "Attachment content size is invalid.",
                    new Dictionary<string, string[]>
                    {
                        ["base64Content"] = new[] { "Uploaded content size must match the upload reservation." }
                    });
            }

            await using var stream = new MemoryStream(bytes, writable: false);
            var (storageKey, contentHash) = await _attachmentStorage.SaveAsync(
                teacherUserId,
                attachment.Id,
                attachment.FileName,
                attachment.ContentType,
                stream,
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.ContentHash) &&
                !string.Equals(request.ContentHash, contentHash, StringComparison.OrdinalIgnoreCase))
            {
                await _attachmentStorage.DeleteAsync(storageKey, cancellationToken);
                throw new ValidationException(
                    "Attachment content hash does not match.",
                    new Dictionary<string, string[]>
                    {
                        ["contentHash"] = new[] { "Content hash does not match the uploaded file." }
                    });
            }

            attachment.StorageKey = storageKey;
            attachment.ContentHash = contentHash;
            attachment.Status = "Uploaded";
            attachment.UploadedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return MapAttachment(attachment);
        }

        public async Task<QuestionAttachmentDto> GetAttachmentAsync(
            string teacherUserId,
            Guid attachmentId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var attachment = await LoadTeacherAttachmentAsync(teacherUserId, attachmentId, cancellationToken);
            EnsureAttachmentReadable(attachment);
            return MapAttachment(attachment);
        }

        public async Task<QuestionBankAttachmentFileDto> OpenAttachmentAsync(
            string teacherUserId,
            Guid attachmentId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var attachment = await LoadTeacherAttachmentAsync(teacherUserId, attachmentId, cancellationToken);
            EnsureAttachmentReadable(attachment);

            var storedFile = await _attachmentStorage.OpenReadAsync(attachment.StorageKey, cancellationToken);
            return new QuestionBankAttachmentFileDto
            {
                Content = storedFile.Content,
                FileName = string.IsNullOrWhiteSpace(attachment.OriginalFileName)
                    ? storedFile.FileName
                    : attachment.OriginalFileName,
                ContentType = string.IsNullOrWhiteSpace(attachment.ContentType)
                    ? storedFile.ContentType
                    : attachment.ContentType
            };
        }

        public async Task DeleteAttachmentAsync(
            string teacherUserId,
            Guid attachmentId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            var attachment = await LoadTeacherAttachmentAsync(teacherUserId, attachmentId, cancellationToken);
            if (attachment.Status == "Deleted")
            {
                return;
            }

            await _attachmentStorage.DeleteAsync(attachment.StorageKey, cancellationToken);
            attachment.Status = "Deleted";
            attachment.DeletedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        private async Task EnsureTeacherExistsAsync(
            string teacherUserId,
            CancellationToken cancellationToken)
        {
            var exists = await _dbContext.TeacherProfiles
                .AnyAsync(profile => profile.UserId == teacherUserId, cancellationToken);

            if (!exists)
            {
                throw new ForbiddenException("Only teacher accounts can manage the question bank.");
            }
        }

        private async Task UpsertTagsAsync(
            Guid questionId,
            string teacherUserId,
            IReadOnlyCollection<string> tagNames,
            CancellationToken cancellationToken)
        {
            var existingJoins = await _dbContext.QuestionBankQuestionTags
                .Where(join => join.QuestionId == questionId)
                .ToArrayAsync(cancellationToken);

            if (existingJoins.Length > 0)
            {
                _dbContext.QuestionBankQuestionTags.RemoveRange(existingJoins);
            }

            var normalizedTagMap = tagNames
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Select(tag => tag.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    tag => NormalizeTagName(tag),
                    tag => tag,
                    StringComparer.Ordinal);

            if (normalizedTagMap.Count == 0)
            {
                return;
            }

            var normalizedNames = normalizedTagMap.Keys.ToArray();
            var existingTags = await _dbContext.QuestionBankTags
                .Where(tag =>
                    tag.OwnerTeacherUserId == teacherUserId &&
                    normalizedNames.Contains(tag.NormalizedName))
                .ToArrayAsync(cancellationToken);

            var tagByNormalized = existingTags.ToDictionary(
                tag => tag.NormalizedName,
                tag => tag,
                StringComparer.Ordinal);

            foreach (var normalizedName in normalizedNames)
            {
                if (!tagByNormalized.TryGetValue(normalizedName, out var tag))
                {
                    tag = new QuestionBankTag
                    {
                        Id = Guid.NewGuid(),
                        OwnerTeacherUserId = teacherUserId,
                        Name = normalizedTagMap[normalizedName],
                        NormalizedName = normalizedName,
                        CreatedAtUtc = DateTime.UtcNow
                    };

                    tagByNormalized[normalizedName] = tag;
                    _dbContext.QuestionBankTags.Add(tag);
                }

                _dbContext.QuestionBankQuestionTags.Add(new QuestionBankQuestionTag
                {
                    QuestionId = questionId,
                    TagId = tag.Id
                });
            }
        }

        private async Task<QuestionBankAttachment> LoadTeacherAttachmentAsync(
            string teacherUserId,
            Guid attachmentId,
            CancellationToken cancellationToken)
        {
            var attachment = await _dbContext.QuestionBankAttachments
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == attachmentId &&
                        candidate.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (attachment is null)
            {
                throw new NotFoundException("Question bank attachment not found.");
            }

            return attachment;
        }

        private async Task<IReadOnlyCollection<QuestionBankAttachment>> ValidateReferencedAttachmentsAsync(
            string teacherUserId,
            IReadOnlyCollection<Guid> attachmentIds,
            CancellationToken cancellationToken)
        {
            if (attachmentIds.Count == 0)
            {
                return Array.Empty<QuestionBankAttachment>();
            }

            var attachments = await _dbContext.QuestionBankAttachments
                .Where(attachment => attachmentIds.Contains(attachment.Id))
                .ToArrayAsync(cancellationToken);
            var byId = attachments.ToDictionary(attachment => attachment.Id);
            var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

            foreach (var attachmentId in attachmentIds)
            {
                if (!byId.TryGetValue(attachmentId, out var attachment) ||
                    attachment.OwnerTeacherUserId != teacherUserId)
                {
                    errors[$"attachments.{attachmentId}"] = new[] { "Attachment was not found." };
                    continue;
                }

                if (attachment.Status == "PendingUpload")
                {
                    errors[$"attachments.{attachmentId}"] = new[] { "PendingUpload attachments cannot be attached to a question." };
                    continue;
                }

                if (attachment.Status == "Deleted")
                {
                    errors[$"attachments.{attachmentId}"] = new[] { "Deleted attachments cannot be attached to a question." };
                    continue;
                }

                if (!AllowedImageContentTypes.Contains(attachment.ContentType))
                {
                    errors[$"attachments.{attachmentId}"] = new[] { "Only image attachments can be used in rich image blocks." };
                }
            }

            if (errors.Count > 0)
            {
                throw new QuestionBankContentValidationException("Question attachments are invalid.", errors);
            }

            return attachments;
        }

        private static void AttachReferencedUploads(
            IReadOnlyCollection<QuestionBankAttachment> attachments,
            Guid questionId,
            Guid questionVersionId,
            DateTime attachedAtUtc)
        {
            foreach (var attachment in attachments)
            {
                attachment.QuestionId = questionId;
                attachment.QuestionVersionId = questionVersionId;
                attachment.Status = "Attached";
                attachment.DeletedAtUtc = null;
                if (!attachment.UploadedAtUtc.HasValue)
                {
                    attachment.UploadedAtUtc = attachedAtUtc;
                }
            }
        }

        private static IReadOnlyCollection<Guid> ExtractReferencedAttachmentIds(string contentJson)
        {
            try
            {
                using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(contentJson) ? "{}" : contentJson);
                return FindAttachmentIds(document.RootElement)
                    .Distinct()
                    .ToArray();
            }
            catch (JsonException)
            {
                return Array.Empty<Guid>();
            }
        }

        private static IEnumerable<Guid> FindAttachmentIds(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in element.EnumerateObject())
                {
                    if (property.NameEquals("attachmentId") &&
                        property.Value.ValueKind == JsonValueKind.String &&
                        Guid.TryParse(property.Value.GetString(), out var attachmentId))
                    {
                        yield return attachmentId;
                    }

                    foreach (var nested in FindAttachmentIds(property.Value))
                    {
                        yield return nested;
                    }
                }
            }
            else if (element.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in element.EnumerateArray())
                {
                    foreach (var nested in FindAttachmentIds(item))
                    {
                        yield return nested;
                    }
                }
            }
        }

        private static IReadOnlyCollection<QuestionBankRenderDiagnosticDto> MapValidationDiagnostics(
            IReadOnlyDictionary<string, string[]> errors)
        {
            return errors
                .SelectMany(error => error.Value.Select(message => new QuestionBankRenderDiagnosticDto
                {
                    Code = "QuestionContentInvalid",
                    Message = message,
                    Path = error.Key
                }))
                .ToArray();
        }

        private static void ValidateAttachmentUploadRequest(
            CreateQuestionBankAttachmentUploadUrlRequestDto request)
        {
            var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(request.FileName))
            {
                errors["fileName"] = new[] { "File name is required." };
            }

            if (!AllowedImageContentTypes.Contains(request.ContentType))
            {
                errors["contentType"] = new[] { "Only PNG, JPEG, and WebP images are supported." };
            }

            if (request.FileSizeBytes <= 0 || request.FileSizeBytes > 5 * 1024 * 1024)
            {
                errors["fileSizeBytes"] = new[] { "Image size must be between 1 byte and 5 MB." };
            }

            if (errors.Count > 0)
            {
                throw new ValidationException("Attachment upload request is invalid.", errors);
            }
        }

        private static void EnsureAttachmentReadable(QuestionBankAttachment attachment)
        {
            if (attachment.Status == "PendingUpload")
            {
                throw new ConflictException("Attachment upload is not complete.");
            }

            if (attachment.Status == "Deleted")
            {
                throw new NotFoundException("Question bank attachment not found.");
            }

            if (string.IsNullOrWhiteSpace(attachment.StorageKey))
            {
                throw new NotFoundException("Question bank attachment file not found.");
            }
        }

        private static string NormalizeFileName(string value)
        {
            var fileName = Path.GetFileName(value.Trim());
            return string.IsNullOrWhiteSpace(fileName) ? "attachment.bin" : fileName;
        }

        private async Task<string> GenerateUniqueQuestionCodeAsync(
            string teacherUserId,
            CancellationToken cancellationToken)
        {
            while (true)
            {
                var candidate = $"QB-{Guid.NewGuid():N}".Substring(0, 11).ToUpperInvariant();
                var exists = await _dbContext.QuestionBankQuestions.AnyAsync(
                    question =>
                        question.OwnerTeacherUserId == teacherUserId &&
                        question.Code == candidate,
                    cancellationToken);

                if (!exists)
                {
                    return candidate;
                }
            }
        }

        private static QuestionDto MapQuestion(QuestionBankQuestion question)
        {
            return new QuestionDto
            {
                Id = question.Id,
                Code = question.Code,
                Status = question.Status.ToString(),
                CurrentVersionNumber = question.CurrentVersionNumber,
                CreatedAtUtc = question.CreatedAtUtc,
                UpdatedAtUtc = question.UpdatedAtUtc,
                Versions = question.Versions
                    .OrderByDescending(version => version.VersionNumber)
                    .Select(MapVersion)
                    .ToArray(),
                Tags = question.QuestionTags
                    .Select(join => join.Tag.Name)
                    .OrderBy(name => name)
                    .ToArray()
            };
        }

        private async Task<QuestionBankQuestion> LoadTeacherQuestionAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);

            var question = await _dbContext.QuestionBankQuestions
                .Include(candidate => candidate.Versions)
                    .ThenInclude(version => version.Attachments)
                .Include(candidate => candidate.QuestionTags)
                    .ThenInclude(join => join.Tag)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == questionId &&
                        candidate.OwnerTeacherUserId == teacherUserId &&
                        candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (question is null)
            {
                throw new NotFoundException("Question not found.");
            }

            return question;
        }

        private static QuestionBankQuestionVersion? GetCurrentVersion(QuestionBankQuestion question)
        {
            return question.Versions.FirstOrDefault(version => version.VersionNumber == question.CurrentVersionNumber) ??
                   question.Versions.OrderByDescending(version => version.VersionNumber).FirstOrDefault();
        }

        private static IEnumerable<QuestionBankQuestion> ApplyFeatureFlagFilter(
            IEnumerable<QuestionBankQuestion> questions,
            bool? required,
            string marker)
        {
            if (!required.HasValue)
            {
                return questions;
            }

            return questions.Where(question =>
            {
                var version = GetCurrentVersion(question);
                var hasMarker = version is not null &&
                    version.ContentJson.Contains(marker, StringComparison.OrdinalIgnoreCase);
                return required.Value == hasMarker;
            });
        }

        private static QuestionVersionDto MapVersion(QuestionBankQuestionVersion version)
        {
            return new QuestionVersionDto
            {
                Id = version.Id,
                VersionNumber = version.VersionNumber,
                QuestionType = version.QuestionType.ToString(),
                StemRichText = version.StemRichText,
                StemPlainText = version.StemPlainText,
                ExplanationRichText = version.ExplanationRichText,
                Difficulty = version.Difficulty,
                EstimatedSeconds = version.EstimatedSeconds,
                ContentSchemaVersion = version.ContentSchemaVersion,
                AnswerKeySchemaVersion = version.AnswerKeySchemaVersion,
                RendererVersion = version.RendererVersion,
                SearchText = version.SearchText,
                ContentJson = version.ContentJson,
                AnswerKeyJson = version.AnswerKeyJson,
                ExplanationJson = version.ExplanationJson,
                CreatedByUserId = version.CreatedByUserId,
                Attachments = version.Attachments
                    .OrderBy(attachment => attachment.CreatedAtUtc)
                    .Select(MapAttachment)
                    .ToArray()
            };
        }

        private static QuestionAttachmentDto MapAttachment(QuestionBankAttachment attachment)
        {
            return new QuestionAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                OriginalFileName = attachment.OriginalFileName,
                ContentType = attachment.ContentType,
                FileSizeBytes = attachment.FileSizeBytes,
                ExternalUrl = attachment.ExternalUrl,
                StorageProvider = attachment.StorageProvider,
                StorageKey = attachment.StorageKey,
                PublicUrl = attachment.PublicUrl,
                Status = attachment.Status,
                CreatedAtUtc = attachment.CreatedAtUtc
            };
        }

        private static QuestionBankExportJobDto MapExportJob(QuestionBankExportJob job)
        {
            var latexFile = job.Files.FirstOrDefault(file => file.ContentType == "application/x-tex");
            var pdfFile = job.Files.FirstOrDefault(file => file.ContentType == "application/pdf");
            var compileLogFile = job.Files.FirstOrDefault(file => file.ContentType == "text/plain");
            return new QuestionBankExportJobDto
            {
                ExportJobId = job.Id,
                Status = job.Status.ToString(),
                Title = job.Title,
                QuestionCount = job.QuestionCount,
                LatexFileId = latexFile?.Id,
                PdfFileId = pdfFile?.Id,
                CompileLogFileId = compileLogFile?.Id,
                DownloadUrl = pdfFile is null ? string.Empty : $"/api/question-bank/exports/{job.Id}/files/{pdfFile.Id}/download",
                Errors = ReadExportErrors(job.ErrorJson),
                Warnings = job.Items
                    .SelectMany(item => ReadStringArray(item.WarningsJson))
                    .ToArray()
            };
        }

        private static IReadOnlyCollection<QuestionBankExportErrorDto> ReadExportErrors(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<IReadOnlyCollection<QuestionBankExportErrorDto>>(
                    string.IsNullOrWhiteSpace(json) ? "[]" : json,
                    JsonOptions) ?? Array.Empty<QuestionBankExportErrorDto>();
            }
            catch (JsonException)
            {
                return new[]
                {
                    new QuestionBankExportErrorDto
                    {
                        Code = "InvalidExportErrorPayload",
                        Message = "Export job error payload could not be parsed."
                    }
                };
            }
        }

        private static IReadOnlyCollection<string> ReadStringArray(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<IReadOnlyCollection<string>>(
                    string.IsNullOrWhiteSpace(json) ? "[]" : json,
                    JsonOptions) ?? Array.Empty<string>();
            }
            catch (JsonException)
            {
                return Array.Empty<string>();
            }
        }

        private static QuestionType ParseQuestionType(string questionType)
        {
            if (Enum.TryParse<QuestionType>(questionType, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Question type is invalid.",
                new Dictionary<string, string[]>
                {
                    ["questionType"] = new[] { "Unsupported question type." }
                });
        }

        private static QuestionStatus ParseQuestionStatus(string status)
        {
            if (Enum.TryParse<QuestionStatus>(status, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Question status is invalid.",
                new Dictionary<string, string[]>
                {
                    ["status"] = new[] { "Status must be Active or Archived." }
                });
        }

        private static string NormalizeTagName(string tagName)
        {
            return tagName.Trim().ToUpperInvariant();
        }

        private static void ValidateQuestionStem(
            string stemRichText,
            string stemPlainText)
        {
            if (!string.IsNullOrWhiteSpace(stemPlainText) || !string.IsNullOrWhiteSpace(stemRichText))
            {
                return;
            }

            throw new ValidationException(
                "Question stem is required.",
                new Dictionary<string, string[]>
                {
                    ["stemPlainText"] = new[] { "Question stem cannot be empty." }
                });
        }
    }
}
