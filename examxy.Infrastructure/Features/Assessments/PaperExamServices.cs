using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using examxy.Application.Exceptions;
using examxy.Application.Features.PaperExams;
using examxy.Application.Features.PaperExams.DTOs;
using examxy.Domain.Assessments;
using examxy.Domain.Classrooms;
using examxy.Domain.QuestionBank;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace examxy.Infrastructure.Features.Assessments
{
    public sealed class LocalPaperExamStorage : IPaperExamStorage
    {
        private readonly string _rootPath;

        public LocalPaperExamStorage(IHostEnvironment hostEnvironment)
        {
            _rootPath = Path.Combine(hostEnvironment.ContentRootPath, "App_Data", "paper-exam");
        }

        public Task<(string StoragePath, string ContentHash)> SaveTemplateAssetAsync(
            Guid templateId,
            Guid versionId,
            string fileName,
            string contentType,
            Stream content,
            CancellationToken cancellationToken = default)
        {
            var directory = Path.Combine(_rootPath, "templates", templateId.ToString("N"), versionId.ToString("N"));
            return SaveAsync(directory, fileName, content, cancellationToken);
        }

        public Task<(string StoragePath, string ContentHash)> SaveSubmissionImageAsync(
            Guid assessmentId,
            string studentUserId,
            string fileName,
            string contentType,
            Stream content,
            CancellationToken cancellationToken = default)
        {
            var directory = Path.Combine(_rootPath, "submissions", assessmentId.ToString("N"), SanitizePathSegment(studentUserId));
            return SaveAsync(directory, fileName, content, cancellationToken);
        }

        public Task<(string StoragePath, string ContentHash)> SaveArtifactAsync(
            Guid submissionId,
            string artifactName,
            string contentType,
            Stream content,
            CancellationToken cancellationToken = default)
        {
            var directory = Path.Combine(_rootPath, "artifacts", submissionId.ToString("N"));
            return SaveAsync(directory, artifactName, content, cancellationToken);
        }

        private static string SanitizePathSegment(string value)
        {
            foreach (var invalidChar in Path.GetInvalidFileNameChars())
            {
                value = value.Replace(invalidChar, '-');
            }

            return value;
        }

        private static async Task<(string StoragePath, string ContentHash)> SaveAsync(
            string directory,
            string fileName,
            Stream content,
            CancellationToken cancellationToken)
        {
            Directory.CreateDirectory(directory);

            var safeFileName = $"{Guid.NewGuid():N}-{SanitizePathSegment(string.IsNullOrWhiteSpace(fileName) ? "asset.bin" : fileName)}";
            var fullPath = Path.Combine(directory, safeFileName);

            await using var output = File.Create(fullPath);
            using var hasher = SHA256.Create();
            await using var cryptoStream = new CryptoStream(output, hasher, CryptoStreamMode.Write);
            await content.CopyToAsync(cryptoStream, cancellationToken);
            await cryptoStream.FlushAsync(cancellationToken);
            cryptoStream.FlushFinalBlock();
            var hash = Convert.ToHexString(hasher.Hash ?? Array.Empty<byte>());

            return (fullPath, hash);
        }
    }

    public sealed class PaperExamTemplateService : IPaperExamTemplateService
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AppDbContext _dbContext;
        private readonly IPaperExamStorage _storage;

        public PaperExamTemplateService(AppDbContext dbContext, IPaperExamStorage storage)
        {
            _dbContext = dbContext;
            _storage = storage;
        }

        public async Task<IReadOnlyCollection<PaperExamTemplateDto>> GetTemplatesAsync(CancellationToken cancellationToken = default)
        {
            var templates = await _dbContext.PaperExamTemplates
                .Include(template => template.Versions)
                .OrderBy(template => template.Code)
                .ToArrayAsync(cancellationToken);

            return templates.Select(MapTemplateSummary).ToArray();
        }

        public async Task<PaperExamTemplateDto> CreateTemplateAsync(CreatePaperExamTemplateRequestDto request, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                throw new ValidationException("Template code is required.", new Dictionary<string, string[]>
                {
                    ["code"] = new[] { "Code is required." }
                });
            }

            var normalizedCode = request.Code.Trim().ToUpperInvariant();
            var exists = await _dbContext.PaperExamTemplates.AnyAsync(
                template => template.Code == normalizedCode,
                cancellationToken);

            if (exists)
            {
                throw new ConflictException("Template code already exists.");
            }

            var now = DateTime.UtcNow;
            var template = new PaperExamTemplate
            {
                Id = Guid.NewGuid(),
                Code = normalizedCode,
                Name = request.Name.Trim(),
                Description = request.Description?.Trim() ?? string.Empty,
                Status = PaperExamTemplateStatus.Draft,
                PaperSize = string.IsNullOrWhiteSpace(request.PaperSize) ? "A4" : request.PaperSize.Trim(),
                OutputWidth = request.OutputWidth,
                OutputHeight = request.OutputHeight,
                MarkerScheme = string.IsNullOrWhiteSpace(request.MarkerScheme) ? "custom" : request.MarkerScheme.Trim(),
                HasStudentIdField = request.HasStudentIdField,
                HasQuizIdField = request.HasQuizIdField,
                HasHandwrittenRegions = request.HasHandwrittenRegions,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            _dbContext.PaperExamTemplates.Add(template);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return await GetTemplateAsync(template.Id, cancellationToken);
        }

        public async Task<PaperExamTemplateDto> GetTemplateAsync(Guid templateId, CancellationToken cancellationToken = default)
        {
            var template = await _dbContext.PaperExamTemplates
                .Include(candidate => candidate.Versions)
                    .ThenInclude(version => version.Assets)
                .Include(candidate => candidate.Versions)
                    .ThenInclude(version => version.MetadataFields)
                .FirstOrDefaultAsync(candidate => candidate.Id == templateId, cancellationToken);

            if (template is null)
            {
                throw new NotFoundException("Paper exam template not found.");
            }

            return MapTemplate(template);
        }

        public async Task<PaperExamTemplateVersionDto> CreateTemplateVersionAsync(Guid templateId, CreatePaperExamTemplateVersionRequestDto request, CancellationToken cancellationToken = default)
        {
            var template = await RequireTemplateAsync(templateId, cancellationToken);
            var now = DateTime.UtcNow;
            var nextVersion = await _dbContext.PaperExamTemplateVersions
                .Where(version => version.TemplateId == templateId)
                .Select(version => (int?)version.VersionNumber)
                .MaxAsync(cancellationToken) ?? 0;

            var version = new PaperExamTemplateVersion
            {
                Id = Guid.NewGuid(),
                TemplateId = template.Id,
                VersionNumber = nextVersion + 1,
                SchemaVersion = request.SchemaVersion.Trim(),
                GeometryConfigHash = string.Empty,
                Status = PaperExamTemplateVersionStatus.Draft,
                QuestionCount = request.QuestionCount,
                OptionsPerQuestion = request.OptionsPerQuestion,
                AbsThreshold = request.AbsThreshold,
                RelThreshold = request.RelThreshold,
                ScoringMethod = request.ScoringMethod.Trim(),
                ScoringParamsJson = request.ScoringParamsJson ?? "{}",
                PayloadSchemaVersion = request.PayloadSchemaVersion.Trim(),
                MinClientAppVersion = string.IsNullOrWhiteSpace(request.MinClientAppVersion) ? null : request.MinClientAppVersion.Trim(),
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            _dbContext.PaperExamTemplateVersions.Add(version);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return await GetTemplateVersionAsync(templateId, version.Id, cancellationToken);
        }

        public async Task<PaperExamTemplateVersionDto> GetTemplateVersionAsync(Guid templateId, Guid versionId, CancellationToken cancellationToken = default)
        {
            var version = await _dbContext.PaperExamTemplateVersions
                .Include(candidate => candidate.Assets)
                .Include(candidate => candidate.MetadataFields)
                .Include(candidate => candidate.Template)
                .FirstOrDefaultAsync(candidate => candidate.Id == versionId && candidate.TemplateId == templateId, cancellationToken);

            if (version is null)
            {
                throw new NotFoundException("Paper exam template version not found.");
            }

            return MapTemplateVersion(version);
        }

        public async Task<PaperExamTemplateVersionDto> UpdateTemplateVersionAsync(Guid templateId, Guid versionId, UpdatePaperExamTemplateVersionRequestDto request, CancellationToken cancellationToken = default)
        {
            var version = await RequireDraftVersionAsync(templateId, versionId, cancellationToken);
            version.SchemaVersion = request.SchemaVersion.Trim();
            version.QuestionCount = request.QuestionCount;
            version.OptionsPerQuestion = request.OptionsPerQuestion;
            version.AbsThreshold = request.AbsThreshold;
            version.RelThreshold = request.RelThreshold;
            version.ScoringMethod = request.ScoringMethod.Trim();
            version.ScoringParamsJson = request.ScoringParamsJson ?? "{}";
            version.PayloadSchemaVersion = request.PayloadSchemaVersion.Trim();
            version.MinClientAppVersion = string.IsNullOrWhiteSpace(request.MinClientAppVersion) ? null : request.MinClientAppVersion.Trim();
            version.UpdatedAtUtc = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return await GetTemplateVersionAsync(templateId, versionId, cancellationToken);
        }

        public async Task<PaperExamTemplateAssetDto> UploadTemplateAssetAsync(Guid templateId, Guid versionId, UploadPaperExamTemplateAssetRequestDto request, CancellationToken cancellationToken = default)
        {
            var version = await RequireDraftVersionAsync(templateId, versionId, cancellationToken);
            var assetType = ParseAssetType(request.AssetType);

            var existing = await _dbContext.PaperExamTemplateAssets
                .FirstOrDefaultAsync(
                    asset => asset.TemplateVersionId == version.Id && asset.AssetType == assetType,
                    cancellationToken);

            string storagePath = string.Empty;
            string contentHash = string.Empty;
            string jsonContent = request.JsonContent ?? string.Empty;

            if (!string.IsNullOrWhiteSpace(request.Base64Content))
            {
                var bytes = Convert.FromBase64String(request.Base64Content);
                await using var stream = new MemoryStream(bytes, writable: false);
                (storagePath, contentHash) = await _storage.SaveTemplateAssetAsync(
                    templateId,
                    versionId,
                    string.IsNullOrWhiteSpace(request.FileName) ? $"{request.AssetType}.bin" : request.FileName,
                    request.ContentType,
                    stream,
                    cancellationToken);
            }
            else if (!string.IsNullOrWhiteSpace(jsonContent))
            {
                contentHash = ComputeHash(jsonContent);
            }
            else
            {
                throw new ValidationException("Asset content is required.", new Dictionary<string, string[]>
                {
                    ["base64Content"] = new[] { "Provide Base64Content or JsonContent." }
                });
            }

            if (existing is null)
            {
                existing = new PaperExamTemplateAsset
                {
                    Id = Guid.NewGuid(),
                    TemplateVersionId = version.Id,
                    AssetType = assetType,
                    CreatedAtUtc = DateTime.UtcNow
                };
                _dbContext.PaperExamTemplateAssets.Add(existing);
            }

            existing.StoragePath = storagePath;
            existing.ContentHash = contentHash;
            existing.JsonContent = jsonContent;
            existing.IsRequired = request.IsRequired;

            version.UpdatedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return MapAsset(existing);
        }

        public async Task<IReadOnlyCollection<PaperExamMetadataFieldDto>> UpsertMetadataFieldsAsync(Guid templateId, Guid versionId, IReadOnlyCollection<UpsertPaperExamMetadataFieldRequestDto> request, CancellationToken cancellationToken = default)
        {
            var version = await RequireDraftVersionAsync(templateId, versionId, cancellationToken);
            var existing = await _dbContext.PaperExamMetadataFields
                .Where(field => field.TemplateVersionId == version.Id)
                .ToDictionaryAsync(field => field.FieldCode, StringComparer.OrdinalIgnoreCase, cancellationToken);

            foreach (var item in request)
            {
                if (string.IsNullOrWhiteSpace(item.FieldCode))
                {
                    continue;
                }

                if (!existing.TryGetValue(item.FieldCode, out var field))
                {
                    field = new PaperExamMetadataField
                    {
                        Id = Guid.NewGuid(),
                        TemplateVersionId = version.Id,
                        FieldCode = item.FieldCode.Trim(),
                        CreatedAtUtc = DateTime.UtcNow
                    };
                    _dbContext.PaperExamMetadataFields.Add(field);
                    existing[field.FieldCode] = field;
                }

                field.Label = item.Label.Trim();
                field.IsRequired = item.IsRequired;
                field.DecodeMode = string.IsNullOrWhiteSpace(item.DecodeMode) ? "bubble_grid" : item.DecodeMode.Trim();
                field.GeometryJson = item.GeometryJson ?? "{}";
                field.ValidationPolicyJson = item.ValidationPolicyJson ?? "{}";
            }

            version.UpdatedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return existing.Values
                .OrderBy(field => field.FieldCode, StringComparer.OrdinalIgnoreCase)
                .Select(MapMetadataField)
                .ToArray();
        }

        public async Task<ValidatePaperExamTemplateVersionResultDto> ValidateTemplateVersionAsync(Guid templateId, Guid versionId, CancellationToken cancellationToken = default)
        {
            var version = await _dbContext.PaperExamTemplateVersions
                .Include(candidate => candidate.Assets)
                .Include(candidate => candidate.MetadataFields)
                .FirstOrDefaultAsync(candidate => candidate.Id == versionId && candidate.TemplateId == templateId, cancellationToken);

            if (version is null)
            {
                throw new NotFoundException("Paper exam template version not found.");
            }

            var errors = new List<string>();
            var warnings = new List<string>();
            var assetTypes = version.Assets.Select(asset => asset.AssetType).ToHashSet();

            if (!assetTypes.Contains(PaperExamTemplateAssetType.TemplateImage))
            {
                errors.Add("Template image asset is required.");
            }

            if (!assetTypes.Contains(PaperExamTemplateAssetType.MarkerLayout))
            {
                errors.Add("Marker layout asset is required.");
            }

            if (!assetTypes.Contains(PaperExamTemplateAssetType.CircleRois))
            {
                errors.Add("Circle ROI asset is required.");
            }

            if (version.QuestionCount <= 0)
            {
                errors.Add("QuestionCount must be greater than zero.");
            }

            if (version.OptionsPerQuestion <= 0)
            {
                errors.Add("OptionsPerQuestion must be greater than zero.");
            }

            if (version.AbsThreshold < 0 || version.AbsThreshold > 1)
            {
                errors.Add("AbsThreshold must be between 0 and 1.");
            }

            if (version.RelThreshold < 0 || version.RelThreshold > 1)
            {
                errors.Add("RelThreshold must be between 0 and 1.");
            }

            if (version.MetadataFields.Count == 0)
            {
                warnings.Add("No metadata fields have been configured.");
            }

            var geometryHash = ComputeGeometryHash(version);
            return new ValidatePaperExamTemplateVersionResultDto
            {
                TemplateVersionId = version.Id,
                IsValid = errors.Count == 0,
                GeometryConfigHash = geometryHash,
                Errors = errors,
                Warnings = warnings
            };
        }

        public async Task<PaperExamTemplateVersionDto> PublishTemplateVersionAsync(Guid templateId, Guid versionId, CancellationToken cancellationToken = default)
        {
            var version = await RequireDraftVersionAsync(templateId, versionId, cancellationToken);
            var validation = await ValidateTemplateVersionAsync(templateId, versionId, cancellationToken);

            if (!validation.IsValid)
            {
                throw new ValidationException(
                    "Template version is invalid.",
                    new Dictionary<string, string[]>
                    {
                        ["templateVersion"] = validation.Errors.ToArray()
                    });
            }

            version.GeometryConfigHash = validation.GeometryConfigHash;
            version.Status = PaperExamTemplateVersionStatus.Published;
            version.PublishedAtUtc = DateTime.UtcNow;
            version.UpdatedAtUtc = version.PublishedAtUtc.Value;

            var template = await RequireTemplateAsync(templateId, cancellationToken);
            template.Status = PaperExamTemplateStatus.Published;
            template.UpdatedAtUtc = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return await GetTemplateVersionAsync(templateId, versionId, cancellationToken);
        }

        public async Task<AssessmentPaperBindingDto?> GetAssessmentBindingAsync(Guid classId, Guid assessmentId, CancellationToken cancellationToken = default)
        {
            var binding = await _dbContext.AssessmentPaperBindings
                .Include(candidate => candidate.TemplateVersion)
                    .ThenInclude(version => version.Template)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.AssessmentId == assessmentId &&
                        candidate.Assessment.ClassId == classId &&
                        candidate.Status == AssessmentPaperBindingStatus.Active,
                    cancellationToken);

            return binding is null ? null : MapBinding(binding);
        }

        public async Task<AssessmentPaperBindingDto> UpsertAssessmentBindingAsync(string teacherUserId, Guid classId, Guid assessmentId, UpsertAssessmentPaperBindingRequestDto request, CancellationToken cancellationToken = default)
        {
            var assessment = await RequireTeacherAssessmentAsync(teacherUserId, classId, assessmentId, cancellationToken);
            var templateVersion = await _dbContext.PaperExamTemplateVersions
                .Include(version => version.Template)
                .FirstOrDefaultAsync(
                    version =>
                        version.Id == request.TemplateVersionId &&
                        version.Status == PaperExamTemplateVersionStatus.Published,
                    cancellationToken);

            if (templateVersion is null)
            {
                throw new NotFoundException("Published paper exam template version not found.");
            }

            var answerMapJson = JsonSerializer.Serialize(
                request.AnswerMap
                    .OrderBy(item => item.QuestionNumber)
                    .ToArray(),
                JsonOptions);

            ValidateAnswerMap(assessment, request.AnswerMap, templateVersion.QuestionCount);

            var existing = await _dbContext.AssessmentPaperBindings
                .Include(candidate => candidate.TemplateVersion)
                    .ThenInclude(version => version.Template)
                .FirstOrDefaultAsync(candidate => candidate.AssessmentId == assessmentId, cancellationToken);

            if (existing is null)
            {
                existing = new AssessmentPaperBinding
                {
                    Id = Guid.NewGuid(),
                    AssessmentId = assessmentId,
                    BindingVersion = 1,
                    CreatedAtUtc = DateTime.UtcNow
                };
                _dbContext.AssessmentPaperBindings.Add(existing);
            }
            else
            {
                existing.BindingVersion += 1;
            }

            existing.TemplateVersionId = templateVersion.Id;
            existing.AnswerMapJson = answerMapJson;
            existing.MetadataPolicyJson = request.MetadataPolicyJson ?? "{}";
            existing.SubmissionPolicyJson = request.SubmissionPolicyJson ?? "{}";
            existing.ReviewPolicyJson = request.ReviewPolicyJson ?? "{}";
            existing.ConfigHash = ComputeHash($"{templateVersion.GeometryConfigHash}|{existing.BindingVersion}|{answerMapJson}|{existing.MetadataPolicyJson}|{existing.SubmissionPolicyJson}|{existing.ReviewPolicyJson}");
            existing.Status = request.Activate ? AssessmentPaperBindingStatus.Active : AssessmentPaperBindingStatus.Draft;
            existing.UpdatedAtUtc = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return await RequireBindingDtoAsync(assessmentId, cancellationToken);
        }

        public async Task<AssessmentPaperBindingDto> ActivateAssessmentBindingAsync(string teacherUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken = default)
        {
            await RequireTeacherAssessmentAsync(teacherUserId, classId, assessmentId, cancellationToken);
            var binding = await _dbContext.AssessmentPaperBindings
                .Include(candidate => candidate.TemplateVersion)
                    .ThenInclude(version => version.Template)
                .FirstOrDefaultAsync(candidate => candidate.AssessmentId == assessmentId, cancellationToken);

            if (binding is null)
            {
                throw new NotFoundException("Assessment paper binding not found.");
            }

            binding.Status = AssessmentPaperBindingStatus.Active;
            binding.UpdatedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            return MapBinding(binding);
        }

        private async Task<PaperExamTemplate> RequireTemplateAsync(Guid templateId, CancellationToken cancellationToken)
        {
            var template = await _dbContext.PaperExamTemplates.FirstOrDefaultAsync(candidate => candidate.Id == templateId, cancellationToken);
            if (template is null)
            {
                throw new NotFoundException("Paper exam template not found.");
            }

            return template;
        }

        private async Task<PaperExamTemplateVersion> RequireDraftVersionAsync(Guid templateId, Guid versionId, CancellationToken cancellationToken)
        {
            var version = await _dbContext.PaperExamTemplateVersions
                .Include(candidate => candidate.Assets)
                .Include(candidate => candidate.MetadataFields)
                .FirstOrDefaultAsync(candidate => candidate.Id == versionId && candidate.TemplateId == templateId, cancellationToken);

            if (version is null)
            {
                throw new NotFoundException("Paper exam template version not found.");
            }

            if (version.Status != PaperExamTemplateVersionStatus.Draft)
            {
                throw new ConflictException("Published template versions are immutable. Create a new draft version instead.");
            }

            return version;
        }

        private async Task<ClassAssessment> RequireTeacherAssessmentAsync(string teacherUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken)
        {
            var assessment = await _dbContext.ClassAssessments
                .Include(candidate => candidate.Items)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == assessmentId &&
                        candidate.ClassId == classId &&
                        candidate.OwnerTeacherUserId == teacherUserId &&
                        candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (assessment is null)
            {
                throw new NotFoundException("Assessment not found.");
            }

            return assessment;
        }

        private async Task<AssessmentPaperBindingDto> RequireBindingDtoAsync(Guid assessmentId, CancellationToken cancellationToken)
        {
            var binding = await _dbContext.AssessmentPaperBindings
                .Include(candidate => candidate.TemplateVersion)
                    .ThenInclude(version => version.Template)
                .FirstAsync(candidate => candidate.AssessmentId == assessmentId, cancellationToken);

            return MapBinding(binding);
        }

        private static void ValidateAnswerMap(ClassAssessment assessment, IReadOnlyCollection<AssessmentPaperBindingMapItemDto> answerMap, int questionCount)
        {
            var assessmentItemIds = assessment.Items.Select(item => item.Id).ToHashSet();
            foreach (var item in answerMap)
            {
                if (item.QuestionNumber <= 0 || item.QuestionNumber > questionCount)
                {
                    throw new ValidationException("Answer map question number is invalid.", new Dictionary<string, string[]>
                    {
                        ["answerMap"] = new[] { $"QuestionNumber {item.QuestionNumber} is outside the template question range." }
                    });
                }

                if (!assessmentItemIds.Contains(item.AssessmentItemId))
                {
                    throw new ValidationException("Answer map assessment item is invalid.", new Dictionary<string, string[]>
                    {
                        ["answerMap"] = new[] { $"AssessmentItemId {item.AssessmentItemId} does not belong to the assessment." }
                    });
                }
            }
        }

        private static string ComputeGeometryHash(PaperExamTemplateVersion version)
        {
            var payload = new StringBuilder()
                .Append(version.TemplateId).Append('|')
                .Append(version.VersionNumber).Append('|')
                .Append(version.QuestionCount).Append('|')
                .Append(version.OptionsPerQuestion).Append('|')
                .Append(version.AbsThreshold).Append('|')
                .Append(version.RelThreshold).Append('|')
                .Append(version.ScoringMethod).Append('|')
                .Append(version.ScoringParamsJson);

            foreach (var asset in version.Assets.OrderBy(asset => asset.AssetType))
            {
                payload.Append('|')
                    .Append(asset.AssetType)
                    .Append(':')
                    .Append(asset.ContentHash)
                    .Append(':')
                    .Append(asset.JsonContent);
            }

            foreach (var field in version.MetadataFields.OrderBy(field => field.FieldCode, StringComparer.OrdinalIgnoreCase))
            {
                payload.Append('|')
                    .Append(field.FieldCode)
                    .Append(':')
                    .Append(field.GeometryJson)
                    .Append(':')
                    .Append(field.ValidationPolicyJson);
            }

            return ComputeHash(payload.ToString());
        }

        private static string ComputeHash(string value)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(bytes);
        }

        private static PaperExamTemplateAssetType ParseAssetType(string value)
        {
            if (Enum.TryParse<PaperExamTemplateAssetType>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException("Asset type is invalid.", new Dictionary<string, string[]>
            {
                ["assetType"] = new[] { "AssetType is not supported." }
            });
        }

        private static PaperExamTemplateDto MapTemplateSummary(PaperExamTemplate template)
        {
            return new PaperExamTemplateDto
            {
                Id = template.Id,
                Code = template.Code,
                Name = template.Name,
                Description = template.Description,
                Status = template.Status.ToString(),
                PaperSize = template.PaperSize,
                OutputWidth = template.OutputWidth,
                OutputHeight = template.OutputHeight,
                MarkerScheme = template.MarkerScheme,
                HasStudentIdField = template.HasStudentIdField,
                HasQuizIdField = template.HasQuizIdField,
                HasHandwrittenRegions = template.HasHandwrittenRegions,
                CreatedAtUtc = template.CreatedAtUtc,
                UpdatedAtUtc = template.UpdatedAtUtc,
                Versions = template.Versions
                    .OrderByDescending(version => version.VersionNumber)
                    .Select(version => new PaperExamTemplateVersionDto
                    {
                        Id = version.Id,
                        TemplateId = version.TemplateId,
                        VersionNumber = version.VersionNumber,
                        SchemaVersion = version.SchemaVersion,
                        GeometryConfigHash = version.GeometryConfigHash,
                        Status = version.Status.ToString(),
                        QuestionCount = version.QuestionCount,
                        OptionsPerQuestion = version.OptionsPerQuestion,
                        AbsThreshold = version.AbsThreshold,
                        RelThreshold = version.RelThreshold,
                        ScoringMethod = version.ScoringMethod,
                        ScoringParamsJson = version.ScoringParamsJson,
                        PayloadSchemaVersion = version.PayloadSchemaVersion,
                        MinClientAppVersion = version.MinClientAppVersion,
                        CreatedAtUtc = version.CreatedAtUtc,
                        UpdatedAtUtc = version.UpdatedAtUtc,
                        PublishedAtUtc = version.PublishedAtUtc
                    })
                    .ToArray()
            };
        }

        private static PaperExamTemplateDto MapTemplate(PaperExamTemplate template)
        {
            var dto = MapTemplateSummary(template);
            dto.Versions = template.Versions
                .OrderByDescending(version => version.VersionNumber)
                .Select(MapTemplateVersion)
                .ToArray();
            return dto;
        }

        private static PaperExamTemplateVersionDto MapTemplateVersion(PaperExamTemplateVersion version)
        {
            return new PaperExamTemplateVersionDto
            {
                Id = version.Id,
                TemplateId = version.TemplateId,
                VersionNumber = version.VersionNumber,
                SchemaVersion = version.SchemaVersion,
                GeometryConfigHash = version.GeometryConfigHash,
                Status = version.Status.ToString(),
                QuestionCount = version.QuestionCount,
                OptionsPerQuestion = version.OptionsPerQuestion,
                AbsThreshold = version.AbsThreshold,
                RelThreshold = version.RelThreshold,
                ScoringMethod = version.ScoringMethod,
                ScoringParamsJson = version.ScoringParamsJson,
                PayloadSchemaVersion = version.PayloadSchemaVersion,
                MinClientAppVersion = version.MinClientAppVersion,
                CreatedAtUtc = version.CreatedAtUtc,
                UpdatedAtUtc = version.UpdatedAtUtc,
                PublishedAtUtc = version.PublishedAtUtc,
                Assets = version.Assets.OrderBy(asset => asset.AssetType).Select(MapAsset).ToArray(),
                MetadataFields = version.MetadataFields.OrderBy(field => field.FieldCode).Select(MapMetadataField).ToArray()
            };
        }

        private static PaperExamTemplateAssetDto MapAsset(PaperExamTemplateAsset asset)
        {
            return new PaperExamTemplateAssetDto
            {
                Id = asset.Id,
                AssetType = asset.AssetType.ToString(),
                StoragePath = asset.StoragePath,
                ContentHash = asset.ContentHash,
                JsonContent = asset.JsonContent,
                IsRequired = asset.IsRequired
            };
        }

        private static PaperExamMetadataFieldDto MapMetadataField(PaperExamMetadataField field)
        {
            return new PaperExamMetadataFieldDto
            {
                Id = field.Id,
                FieldCode = field.FieldCode,
                Label = field.Label,
                IsRequired = field.IsRequired,
                DecodeMode = field.DecodeMode,
                GeometryJson = field.GeometryJson,
                ValidationPolicyJson = field.ValidationPolicyJson
            };
        }

        private static AssessmentPaperBindingDto MapBinding(AssessmentPaperBinding binding)
        {
            return new AssessmentPaperBindingDto
            {
                Id = binding.Id,
                AssessmentId = binding.AssessmentId,
                TemplateVersionId = binding.TemplateVersionId,
                TemplateCode = binding.TemplateVersion.Template.Code,
                TemplateVersionNumber = binding.TemplateVersion.VersionNumber,
                BindingVersion = binding.BindingVersion,
                ConfigHash = binding.ConfigHash,
                Status = binding.Status.ToString(),
                AnswerMapJson = binding.AnswerMapJson,
                MetadataPolicyJson = binding.MetadataPolicyJson,
                SubmissionPolicyJson = binding.SubmissionPolicyJson,
                ReviewPolicyJson = binding.ReviewPolicyJson,
                CreatedAtUtc = binding.CreatedAtUtc,
                UpdatedAtUtc = binding.UpdatedAtUtc
            };
        }
    }

    public sealed class StudentOfflineScanConfigService : IStudentOfflineScanConfigService
    {
        private readonly AppDbContext _dbContext;

        public StudentOfflineScanConfigService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<StudentOfflineScanConfigDto> GetScanConfigAsync(string studentUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken = default)
        {
            await EnsureStudentMemberClassAsync(studentUserId, classId, cancellationToken);

            var assessment = await _dbContext.ClassAssessments
                .Include(candidate => candidate.PaperBindings)
                    .ThenInclude(binding => binding.TemplateVersion)
                        .ThenInclude(version => version.Template)
                .Include(candidate => candidate.PaperBindings)
                    .ThenInclude(binding => binding.TemplateVersion)
                        .ThenInclude(version => version.Assets)
                .Include(candidate => candidate.PaperBindings)
                    .ThenInclude(binding => binding.TemplateVersion)
                        .ThenInclude(version => version.MetadataFields)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == assessmentId &&
                        candidate.ClassId == classId &&
                        candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (assessment is null)
            {
                throw new NotFoundException("Assessment not found.");
            }

            var now = DateTime.UtcNow;
            if (assessment.Status != AssessmentStatus.Published ||
                (assessment.PublishAtUtc.HasValue && assessment.PublishAtUtc > now) ||
                (assessment.CloseAtUtc.HasValue && assessment.CloseAtUtc <= now))
            {
                throw new ConflictException("Assessment is not available for offline submissions.");
            }

            var binding = assessment.PaperBindings.FirstOrDefault(candidate => candidate.Status == AssessmentPaperBindingStatus.Active);
            if (binding is null)
            {
                throw new NotFoundException("Assessment paper binding not found.");
            }

            var version = binding.TemplateVersion;
            if (version.Status != PaperExamTemplateVersionStatus.Published)
            {
                throw new ConflictException("Paper exam template version is not published.");
            }

            return new StudentOfflineScanConfigDto
            {
                AssessmentId = assessment.Id,
                ClassId = classId,
                BindingId = binding.Id,
                BindingVersion = binding.BindingVersion,
                TemplateCode = version.Template.Code,
                TemplateVersion = version.VersionNumber,
                SchemaVersion = version.PayloadSchemaVersion,
                ConfigHash = binding.ConfigHash,
                PaperSize = version.Template.PaperSize,
                OutputWidth = version.Template.OutputWidth,
                OutputHeight = version.Template.OutputHeight,
                MarkerScheme = version.Template.MarkerScheme,
                QuestionCount = version.QuestionCount,
                OptionsPerQuestion = version.OptionsPerQuestion,
                AbsThreshold = version.AbsThreshold,
                RelThreshold = version.RelThreshold,
                ScoringMethod = version.ScoringMethod,
                MarkerLayout = GetAssetJson(version, PaperExamTemplateAssetType.MarkerLayout, "{}"),
                CircleRois = GetAssetJson(version, PaperExamTemplateAssetType.CircleRois, "[]"),
                IdBubbleFields = GetAssetJson(version, PaperExamTemplateAssetType.IdBubbleFields, "[]"),
                RegionWindows = GetAssetJson(version, PaperExamTemplateAssetType.RegionWindows, "[]"),
                RequiredMetadataFields = version.MetadataFields.Where(field => field.IsRequired).Select(field => field.FieldCode).ToArray(),
                OptionalMetadataFields = version.MetadataFields.Where(field => !field.IsRequired).Select(field => field.FieldCode).ToArray(),
                MetadataPolicy = ParseJson(binding.MetadataPolicyJson, "{}"),
                ReviewPolicy = ParseJson(binding.ReviewPolicyJson, "{}"),
                SubmissionPolicy = ParseJson(binding.SubmissionPolicyJson, "{}"),
                MinClientAppVersion = version.MinClientAppVersion,
                CloseAtUtc = assessment.CloseAtUtc
            };
        }

        private async Task EnsureStudentMemberClassAsync(string studentUserId, Guid classId, CancellationToken cancellationToken)
        {
            var isMember = await _dbContext.ClassMemberships.AnyAsync(
                membership =>
                    membership.ClassId == classId &&
                    membership.StudentUserId == studentUserId &&
                    membership.Status == ClassMembershipStatus.Active,
                cancellationToken);

            if (!isMember)
            {
                throw new ForbiddenException("Only class students can access offline scan config.");
            }
        }

        private static JsonElement GetAssetJson(PaperExamTemplateVersion version, PaperExamTemplateAssetType assetType, string fallbackJson)
        {
            var asset = version.Assets.FirstOrDefault(candidate => candidate.AssetType == assetType);
            return ParseJson(asset?.JsonContent, fallbackJson);
        }

        private static JsonElement ParseJson(string? json, string fallbackJson)
        {
            using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? fallbackJson : json);
            return document.RootElement.Clone();
        }
    }

    public sealed class OfflineAssessmentScanService : IOfflineAssessmentScanService
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AppDbContext _dbContext;
        private readonly IPaperExamStorage _storage;

        public OfflineAssessmentScanService(AppDbContext dbContext, IPaperExamStorage storage)
        {
            _dbContext = dbContext;
            _storage = storage;
        }

        public async Task<AssessmentScanSubmissionDto> SubmitScanAsync(string studentUserId, Guid classId, Guid assessmentId, SubmitOfflineAssessmentScanRequestDto request, CancellationToken cancellationToken = default)
        {
            await EnsureStudentMemberClassAsync(studentUserId, classId, cancellationToken);

            var assessment = await _dbContext.ClassAssessments
                .Include(candidate => candidate.Items)
                .Include(candidate => candidate.PaperBindings)
                    .ThenInclude(binding => binding.TemplateVersion)
                        .ThenInclude(version => version.Template)
                .Include(candidate => candidate.PaperBindings)
                    .ThenInclude(binding => binding.TemplateVersion)
                        .ThenInclude(version => version.Assets)
                .Include(candidate => candidate.PaperBindings)
                    .ThenInclude(binding => binding.TemplateVersion)
                        .ThenInclude(version => version.MetadataFields)
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == assessmentId && candidate.ClassId == classId && candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (assessment is null)
            {
                throw new NotFoundException("Assessment not found.");
            }

            ValidateAssessmentWindow(assessment);

            var binding = assessment.PaperBindings.FirstOrDefault(candidate => candidate.Id == request.BindingId);
            if (binding is null || binding.Status != AssessmentPaperBindingStatus.Active)
            {
                throw new NotFoundException("Active assessment paper binding not found.");
            }

            if (binding.BindingVersion != request.BindingVersionUsed)
            {
                throw new ConflictException("Binding version mismatch.");
            }

            if (!string.Equals(binding.ConfigHash, request.ConfigHashUsed, StringComparison.Ordinal))
            {
                throw new ConflictException("Config hash mismatch.");
            }

            var version = binding.TemplateVersion;
            if (!string.Equals(version.PayloadSchemaVersion, request.ClientSchemaVersion, StringComparison.OrdinalIgnoreCase))
            {
                throw new ConflictException("Client schema version is not compatible with the published template.");
            }

            var allowResubmit = ReadBooleanPolicy(binding.SubmissionPolicyJson, "allowResubmit");
            var existingSubmission = await _dbContext.AssessmentScanSubmissions
                .Include(candidate => candidate.Result)
                .Include(candidate => candidate.Answers)
                .FirstOrDefaultAsync(
                    candidate => candidate.AssessmentId == assessmentId && candidate.StudentUserId == studentUserId,
                    cancellationToken);

            if (existingSubmission is not null && !allowResubmit)
            {
                throw new ConflictException("Offline submission already exists for this assessment.");
            }

            var now = DateTime.UtcNow;
            var submission = existingSubmission ?? new AssessmentScanSubmission
            {
                Id = Guid.NewGuid(),
                AssessmentId = assessmentId,
                StudentUserId = studentUserId,
                CreatedAtUtc = now
            };

            submission.BindingId = binding.Id;
            submission.BindingVersionUsed = request.BindingVersionUsed;
            submission.ConfigHashUsed = request.ConfigHashUsed;
            submission.ClientSchemaVersion = request.ClientSchemaVersion;
            submission.ClientAppVersion = request.ClientAppVersion;
            submission.RawScanPayloadJson = string.IsNullOrWhiteSpace(request.RawScanPayloadJson)
                ? BuildRawScanPayload(request)
                : request.RawScanPayloadJson;
            submission.RawImagePath = request.RawImageStoragePath;

            var policyWarnings = new List<string>();
            var policyConflicts = new List<string>();
            var detectedStudentId = TryGetMetadataValue(request.MetadataJson, "student_id");
            var detectedQuizId = TryGetMetadataValue(request.MetadataJson, "quiz_id");
            var studentProfile = await _dbContext.StudentProfiles.FirstOrDefaultAsync(profile => profile.UserId == studentUserId, cancellationToken);
            if (!string.IsNullOrWhiteSpace(detectedStudentId) &&
                !string.IsNullOrWhiteSpace(studentProfile?.StudentCode) &&
                !string.Equals(detectedStudentId, studentProfile.StudentCode, StringComparison.OrdinalIgnoreCase))
            {
                policyConflicts.Add("student_id_mismatch");
            }

            policyWarnings.AddRange(ReadStringArray(request.WarningFlagsJson));
            policyConflicts.AddRange(ReadStringArray(request.ConflictFlagsJson));

            var grading = GradeScanAnswers(assessment, binding.AnswerMapJson, request.Answers);
            var needsReview = policyWarnings.Count > 0 || policyConflicts.Count > 0 || grading.MissingMappedQuestions.Count > 0;
            if (grading.MissingMappedQuestions.Count > 0)
            {
                policyWarnings.Add("missing_answers");
            }

            submission.Status = needsReview
                ? AssessmentScanSubmissionStatus.NeedsReview
                : AssessmentScanSubmissionStatus.AutoGraded;
            submission.UpdatedAtUtc = now;

            if (existingSubmission is null)
            {
                _dbContext.AssessmentScanSubmissions.Add(submission);
            }

            if (existingSubmission is not null)
            {
                _dbContext.AssessmentScanAnswers.RemoveRange(existingSubmission.Answers);
                var existingArtifacts = await _dbContext.AssessmentScanArtifacts
                    .Where(candidate => candidate.SubmissionId == submission.Id)
                    .ToArrayAsync(cancellationToken);
                _dbContext.AssessmentScanArtifacts.RemoveRange(existingArtifacts);
                if (existingSubmission.Result is not null)
                {
                    _dbContext.AssessmentScanResults.Remove(existingSubmission.Result);
                }
            }

            var scanAnswers = grading.Answers
                .Select(answer => new AssessmentScanAnswer
                {
                    Id = Guid.NewGuid(),
                    SubmissionId = submission.Id,
                    AssessmentItemId = answer.AssessmentItemId,
                    QuestionNumber = answer.QuestionNumber,
                    DetectedOption = answer.DetectedOption,
                    DetectedAnswerJson = answer.DetectedAnswerJson,
                    IsCorrect = answer.IsCorrect,
                    EarnedPoints = answer.EarnedPoints,
                    ConfidenceJson = answer.ConfidenceJson,
                    CreatedAtUtc = now
                })
                .ToArray();

            var result = new AssessmentScanResult
            {
                Id = Guid.NewGuid(),
                SubmissionId = submission.Id,
                Score = grading.Score,
                GradedQuestionCount = grading.GradedQuestionCount,
                TotalQuestionCount = version.QuestionCount,
                DetectedStudentId = detectedStudentId,
                DetectedQuizId = detectedQuizId,
                ConfidenceSummaryJson = string.IsNullOrWhiteSpace(request.ConfidenceSummaryJson) ? "{}" : request.ConfidenceSummaryJson,
                WarningFlagsJson = JsonSerializer.Serialize(policyWarnings.Distinct(StringComparer.OrdinalIgnoreCase).ToArray(), JsonOptions),
                ConflictFlagsJson = JsonSerializer.Serialize(policyConflicts.Distinct(StringComparer.OrdinalIgnoreCase).ToArray(), JsonOptions),
                CreatedAtUtc = now
            };

            _dbContext.AssessmentScanAnswers.AddRange(scanAnswers);
            _dbContext.AssessmentScanResults.Add(result);

            _dbContext.AssessmentScanArtifacts.Add(new AssessmentScanArtifact
            {
                Id = Guid.NewGuid(),
                SubmissionId = submission.Id,
                ArtifactType = "raw_image",
                StoragePath = submission.RawImagePath,
                ContentHash = string.Empty,
                CreatedAtUtc = now
            });

            var overlayPayload = BuildOverlayPayload(version, scanAnswers, grading.Answers);
            var overlayBytes = Encoding.UTF8.GetBytes(overlayPayload);
            await using (var overlayStream = new MemoryStream(overlayBytes, writable: false))
            {
                var overlayArtifact = await _storage.SaveArtifactAsync(
                    submission.Id,
                    "bubble-overlay.json",
                    "application/json",
                    overlayStream,
                    cancellationToken);

                _dbContext.AssessmentScanArtifacts.Add(new AssessmentScanArtifact
                {
                    Id = Guid.NewGuid(),
                    SubmissionId = submission.Id,
                    ArtifactType = "bubble_overlay",
                    StoragePath = overlayArtifact.StoragePath,
                    ContentHash = overlayArtifact.ContentHash,
                    CreatedAtUtc = now
                });
            }

            var debugBytes = Encoding.UTF8.GetBytes(submission.RawScanPayloadJson);
            await using (var debugStream = new MemoryStream(debugBytes, writable: false))
            {
                var debugArtifact = await _storage.SaveArtifactAsync(
                    submission.Id,
                    "scan-payload.json",
                    "application/json",
                    debugStream,
                    cancellationToken);

                _dbContext.AssessmentScanArtifacts.Add(new AssessmentScanArtifact
                {
                    Id = Guid.NewGuid(),
                    SubmissionId = submission.Id,
                    ArtifactType = "debug_payload",
                    StoragePath = debugArtifact.StoragePath,
                    ContentHash = debugArtifact.ContentHash,
                    CreatedAtUtc = now
                });
            }

            await UpsertAttemptFromScanAsync(assessment, submission, scanAnswers, result, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return await LoadSubmissionDtoAsync(submission.Id, cancellationToken);
        }

        public async Task<AssessmentScanSubmissionDto?> GetMySubmissionAsync(string studentUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken = default)
        {
            await EnsureStudentMemberClassAsync(studentUserId, classId, cancellationToken);
            var submission = await _dbContext.AssessmentScanSubmissions
                .Where(candidate => candidate.AssessmentId == assessmentId && candidate.StudentUserId == studentUserId)
                .Select(candidate => candidate.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return submission == Guid.Empty
                ? null
                : await LoadSubmissionDtoAsync(submission, cancellationToken);
        }

        public async Task<IReadOnlyCollection<AssessmentScanSubmissionDto>> GetSubmissionsAsync(string teacherUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerAssessmentAsync(teacherUserId, classId, assessmentId, cancellationToken);
            var submissionIds = await _dbContext.AssessmentScanSubmissions
                .Where(candidate => candidate.AssessmentId == assessmentId)
                .OrderByDescending(candidate => candidate.CreatedAtUtc)
                .Select(candidate => candidate.Id)
                .ToArrayAsync(cancellationToken);

            var submissions = new List<AssessmentScanSubmissionDto>(submissionIds.Length);
            foreach (var submissionId in submissionIds)
            {
                submissions.Add(await LoadSubmissionDtoAsync(submissionId, cancellationToken));
            }

            return submissions;
        }

        public async Task<AssessmentScanSubmissionDto> GetSubmissionAsync(string teacherUserId, Guid classId, Guid assessmentId, Guid submissionId, CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerAssessmentAsync(teacherUserId, classId, assessmentId, cancellationToken);
            return await LoadSubmissionDtoAsync(submissionId, cancellationToken);
        }

        public async Task<AssessmentScanSubmissionDto> ReviewSubmissionAsync(string teacherUserId, Guid classId, Guid assessmentId, Guid submissionId, ReviewOfflineAssessmentScanRequestDto request, CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerAssessmentAsync(teacherUserId, classId, assessmentId, cancellationToken);
            var submission = await _dbContext.AssessmentScanSubmissions
                .Include(candidate => candidate.Assessment)
                    .ThenInclude(assessment => assessment.Items)
                .Include(candidate => candidate.Binding)
                    .ThenInclude(binding => binding.TemplateVersion)
                        .ThenInclude(version => version.Assets)
                .Include(candidate => candidate.Result)
                .Include(candidate => candidate.Answers)
                .FirstOrDefaultAsync(candidate => candidate.Id == submissionId && candidate.AssessmentId == assessmentId, cancellationToken);

            if (submission is null)
            {
                throw new NotFoundException("Offline submission not found.");
            }

            if (request.OverrideAnswers.Count > 0)
            {
                var grading = GradeScanAnswers(submission.Assessment, submission.Binding.AnswerMapJson, request.OverrideAnswers);
                _dbContext.AssessmentScanAnswers.RemoveRange(submission.Answers);
                submission.Answers.Clear();

                foreach (var answer in grading.Answers)
                {
                    submission.Answers.Add(new AssessmentScanAnswer
                    {
                        Id = Guid.NewGuid(),
                        SubmissionId = submission.Id,
                        AssessmentItemId = answer.AssessmentItemId,
                        QuestionNumber = answer.QuestionNumber,
                        DetectedOption = answer.DetectedOption,
                        DetectedAnswerJson = answer.DetectedAnswerJson,
                        IsCorrect = answer.IsCorrect,
                        EarnedPoints = answer.EarnedPoints,
                        ConfidenceJson = answer.ConfidenceJson,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }

                if (submission.Result is not null)
                {
                    submission.Result.Score = grading.Score;
                    submission.Result.GradedQuestionCount = grading.GradedQuestionCount;
                    submission.Result.WarningFlagsJson = "[]";
                    submission.Result.ConflictFlagsJson = "[]";
                }
            }

            submission.Status = request.ForceFinalize
                ? AssessmentScanSubmissionStatus.Finalized
                : AssessmentScanSubmissionStatus.NeedsReview;
            submission.UpdatedAtUtc = DateTime.UtcNow;
            if (request.ForceFinalize)
            {
                submission.FinalizedAtUtc = submission.UpdatedAtUtc;
            }

            await SyncAttemptStatusAsync(submission, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return await LoadSubmissionDtoAsync(submission.Id, cancellationToken);
        }

        public async Task<AssessmentScanSubmissionDto> FinalizeSubmissionAsync(string teacherUserId, Guid classId, Guid assessmentId, Guid submissionId, CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerAssessmentAsync(teacherUserId, classId, assessmentId, cancellationToken);
            var submission = await _dbContext.AssessmentScanSubmissions
                .FirstOrDefaultAsync(candidate => candidate.Id == submissionId && candidate.AssessmentId == assessmentId, cancellationToken);

            if (submission is null)
            {
                throw new NotFoundException("Offline submission not found.");
            }

            submission.Status = AssessmentScanSubmissionStatus.Finalized;
            submission.FinalizedAtUtc = DateTime.UtcNow;
            submission.UpdatedAtUtc = submission.FinalizedAtUtc.Value;

            await SyncAttemptStatusAsync(submission, cancellationToken);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return await LoadSubmissionDtoAsync(submission.Id, cancellationToken);
        }

        private async Task UpsertAttemptFromScanAsync(
            ClassAssessment assessment,
            AssessmentScanSubmission submission,
            IReadOnlyCollection<AssessmentScanAnswer> scanAnswers,
            AssessmentScanResult result,
            CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;
            var attempt = await _dbContext.StudentAssessmentAttempts
                .Include(candidate => candidate.Answers)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.AssessmentId == assessment.Id &&
                        candidate.StudentUserId == submission.StudentUserId,
                    cancellationToken);

            if (attempt is null)
            {
                var existingCount = await _dbContext.StudentAssessmentAttempts.CountAsync(
                    candidate => candidate.AssessmentId == assessment.Id && candidate.StudentUserId == submission.StudentUserId,
                    cancellationToken);

                attempt = new StudentAssessmentAttempt
                {
                    Id = Guid.NewGuid(),
                    AssessmentId = assessment.Id,
                    ClassId = assessment.ClassId,
                    StudentUserId = submission.StudentUserId,
                    AttemptNumber = existingCount + 1,
                    Status = submission.Status == AssessmentScanSubmissionStatus.NeedsReview
                        ? StudentAssessmentAttemptStatus.NeedsReview
                        : StudentAssessmentAttemptStatus.AutoGraded,
                    StartedAtUtc = now,
                    SubmittedAtUtc = now,
                    AutoGradedAtUtc = now,
                    TimeLimitMinutesSnapshot = assessment.TimeLimitMinutes,
                    MaxScore = assessment.Items.Sum(item => item.Points),
                    EarnedScore = result.Score,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now
                };

                _dbContext.StudentAssessmentAttempts.Add(attempt);
            }
            else
            {
                attempt.Status = submission.Status == AssessmentScanSubmissionStatus.NeedsReview
                    ? StudentAssessmentAttemptStatus.NeedsReview
                    : submission.Status == AssessmentScanSubmissionStatus.Finalized
                        ? StudentAssessmentAttemptStatus.Finalized
                        : StudentAssessmentAttemptStatus.AutoGraded;
                attempt.SubmittedAtUtc = now;
                attempt.AutoGradedAtUtc = now;
                attempt.MaxScore = assessment.Items.Sum(item => item.Points);
                attempt.EarnedScore = result.Score;
                attempt.UpdatedAtUtc = now;
                if (attempt.Answers.Count > 0)
                {
                    _dbContext.StudentAssessmentAnswers.RemoveRange(attempt.Answers);
                }
            }

            foreach (var scanAnswer in scanAnswers)
            {
                attempt.Answers.Add(new StudentAssessmentAnswer
                {
                    Id = Guid.NewGuid(),
                    AttemptId = attempt.Id,
                    AssessmentItemId = scanAnswer.AssessmentItemId,
                    QuestionType = assessment.Items.First(item => item.Id == scanAnswer.AssessmentItemId).SnapshotQuestionType,
                    AnswerJson = scanAnswer.DetectedAnswerJson,
                    IsCorrect = scanAnswer.IsCorrect,
                    EarnedPoints = scanAnswer.EarnedPoints,
                    AutoGradedAtUtc = now,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now
                });
            }
        }

        private async Task SyncAttemptStatusAsync(AssessmentScanSubmission submission, CancellationToken cancellationToken)
        {
            var attempt = await _dbContext.StudentAssessmentAttempts
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.AssessmentId == submission.AssessmentId &&
                        candidate.StudentUserId == submission.StudentUserId,
                    cancellationToken);

            if (attempt is null)
            {
                return;
            }

            attempt.Status = submission.Status switch
            {
                AssessmentScanSubmissionStatus.AutoGraded => StudentAssessmentAttemptStatus.AutoGraded,
                AssessmentScanSubmissionStatus.Finalized => StudentAssessmentAttemptStatus.Finalized,
                _ => StudentAssessmentAttemptStatus.NeedsReview
            };
            attempt.UpdatedAtUtc = DateTime.UtcNow;
        }

        private async Task<AssessmentScanSubmissionDto> LoadSubmissionDtoAsync(Guid submissionId, CancellationToken cancellationToken)
        {
            var submission = await _dbContext.AssessmentScanSubmissions
                .Include(candidate => candidate.Result)
                .Include(candidate => candidate.Answers)
                .Include(candidate => candidate.Artifacts)
                .FirstOrDefaultAsync(candidate => candidate.Id == submissionId, cancellationToken);

            if (submission is null)
            {
                throw new NotFoundException("Offline submission not found.");
            }

            return new AssessmentScanSubmissionDto
            {
                Id = submission.Id,
                AssessmentId = submission.AssessmentId,
                StudentUserId = submission.StudentUserId,
                BindingId = submission.BindingId,
                BindingVersionUsed = submission.BindingVersionUsed,
                ConfigHashUsed = submission.ConfigHashUsed,
                ClientSchemaVersion = submission.ClientSchemaVersion,
                ClientAppVersion = submission.ClientAppVersion,
                RawImagePath = submission.RawImagePath,
                Status = submission.Status.ToString(),
                CreatedAtUtc = submission.CreatedAtUtc,
                UpdatedAtUtc = submission.UpdatedAtUtc,
                FinalizedAtUtc = submission.FinalizedAtUtc,
                Result = submission.Result is null
                    ? null
                    : new AssessmentScanResultDto
                    {
                        Id = submission.Result.Id,
                        Score = submission.Result.Score,
                        GradedQuestionCount = submission.Result.GradedQuestionCount,
                        TotalQuestionCount = submission.Result.TotalQuestionCount,
                        DetectedStudentId = submission.Result.DetectedStudentId,
                        DetectedQuizId = submission.Result.DetectedQuizId,
                        ConfidenceSummaryJson = submission.Result.ConfidenceSummaryJson,
                        WarningFlagsJson = submission.Result.WarningFlagsJson,
                        ConflictFlagsJson = submission.Result.ConflictFlagsJson
                    },
                Answers = submission.Answers
                    .OrderBy(answer => answer.QuestionNumber)
                    .Select(answer => new AssessmentScanAnswerDto
                    {
                        Id = answer.Id,
                        AssessmentItemId = answer.AssessmentItemId,
                        QuestionNumber = answer.QuestionNumber,
                        DetectedOption = answer.DetectedOption,
                        DetectedAnswerJson = answer.DetectedAnswerJson,
                        IsCorrect = answer.IsCorrect,
                        EarnedPoints = answer.EarnedPoints,
                        ConfidenceJson = answer.ConfidenceJson
                    })
                    .ToArray(),
                Artifacts = submission.Artifacts
                    .OrderBy(artifact => artifact.CreatedAtUtc)
                    .Select(artifact => new AssessmentScanArtifactDto
                    {
                        Id = artifact.Id,
                        ArtifactType = artifact.ArtifactType,
                        StoragePath = artifact.StoragePath,
                        ContentHash = artifact.ContentHash
                    })
                    .ToArray()
            };
        }

        private static string BuildOverlayPayload(
            PaperExamTemplateVersion version,
            IReadOnlyCollection<AssessmentScanAnswer> persistedAnswers,
            IReadOnlyCollection<GradedScanAnswer> gradedAnswers)
        {
            var circleRoisAsset = version.Assets.FirstOrDefault(asset => asset.AssetType == PaperExamTemplateAssetType.CircleRois)?.JsonContent ?? "[]";
            var overlay = new
            {
                questionCount = version.QuestionCount,
                optionsPerQuestion = version.OptionsPerQuestion,
                circleRois = ParseJsonNode(circleRoisAsset),
                answers = gradedAnswers.Select(answer => new
                {
                    answer.QuestionNumber,
                    answer.AssessmentItemId,
                    answer.DetectedOption,
                    answer.IsCorrect,
                    answer.EarnedPoints
                })
            };

            return JsonSerializer.Serialize(overlay, JsonOptions);
        }

        private static object? ParseJsonNode(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return null;
            }

            return JsonSerializer.Deserialize<object>(json, JsonOptions);
        }

        private static string BuildRawScanPayload(SubmitOfflineAssessmentScanRequestDto request)
        {
            return JsonSerializer.Serialize(new
            {
                request.BindingId,
                request.BindingVersionUsed,
                request.ConfigHashUsed,
                request.ClientSchemaVersion,
                request.ClientAppVersion,
                request.Answers,
                metadata = ParseJsonNode(request.MetadataJson),
                confidence = ParseJsonNode(request.ConfidenceSummaryJson),
                warnings = ParseJsonNode(request.WarningFlagsJson),
                conflicts = ParseJsonNode(request.ConflictFlagsJson)
            }, JsonOptions);
        }

        private static void ValidateAssessmentWindow(ClassAssessment assessment)
        {
            var now = DateTime.UtcNow;
            if (assessment.Status != AssessmentStatus.Published ||
                (assessment.PublishAtUtc.HasValue && assessment.PublishAtUtc > now) ||
                (assessment.CloseAtUtc.HasValue && assessment.CloseAtUtc <= now))
            {
                throw new ConflictException("Assessment is not open for offline submission.");
            }
        }

        private async Task EnsureStudentMemberClassAsync(string studentUserId, Guid classId, CancellationToken cancellationToken)
        {
            var isMember = await _dbContext.ClassMemberships.AnyAsync(
                membership =>
                    membership.ClassId == classId &&
                    membership.StudentUserId == studentUserId &&
                    membership.Status == ClassMembershipStatus.Active,
                cancellationToken);

            if (!isMember)
            {
                throw new ForbiddenException("Only class students can submit offline assessments.");
            }
        }

        private async Task EnsureTeacherOwnerAssessmentAsync(string teacherUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken)
        {
            var exists = await _dbContext.ClassAssessments.AnyAsync(
                candidate =>
                    candidate.Id == assessmentId &&
                    candidate.ClassId == classId &&
                    candidate.OwnerTeacherUserId == teacherUserId &&
                    candidate.DeletedAtUtc == null,
                cancellationToken);

            if (!exists)
            {
                throw new NotFoundException("Assessment not found.");
            }
        }

        private static bool ReadBooleanPolicy(string json, string propertyName)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return false;
            }

            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return false;
            }

            return document.RootElement.TryGetProperty(propertyName, out var value) &&
                   value.ValueKind == JsonValueKind.True;
        }

        private static IReadOnlyCollection<string> ReadStringArray(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return Array.Empty<string>();
            }

            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<string>();
            }

            return document.RootElement.EnumerateArray()
                .Select(item => item.ValueKind == JsonValueKind.String ? item.GetString() ?? string.Empty : item.GetRawText())
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .ToArray();
        }

        private static string? TryGetMetadataValue(string metadataJson, string propertyName)
        {
            if (string.IsNullOrWhiteSpace(metadataJson))
            {
                return null;
            }

            using var document = JsonDocument.Parse(metadataJson);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            if (!document.RootElement.TryGetProperty(propertyName, out var property))
            {
                return null;
            }

            return property.ValueKind == JsonValueKind.String ? property.GetString() : property.GetRawText();
        }

        private static ScanGradingResult GradeScanAnswers(
            ClassAssessment assessment,
            string answerMapJson,
            IReadOnlyCollection<OfflineRecognizedAnswerDto> answers)
        {
            var answerMap = JsonSerializer.Deserialize<IReadOnlyCollection<AssessmentPaperBindingMapItemDto>>(answerMapJson, JsonOptions)
                ?? Array.Empty<AssessmentPaperBindingMapItemDto>();
            var answersByQuestion = answers.ToDictionary(answer => answer.QuestionNumber);
            var itemsById = assessment.Items.ToDictionary(item => item.Id);
            var gradedAnswers = new List<GradedScanAnswer>();
            var missingMappedQuestions = new List<int>();
            decimal score = 0;
            int gradedQuestionCount = 0;

            foreach (var mapping in answerMap.OrderBy(item => item.QuestionNumber))
            {
                if (!itemsById.TryGetValue(mapping.AssessmentItemId, out var item))
                {
                    continue;
                }

                if (!answersByQuestion.TryGetValue(mapping.QuestionNumber, out var recognized))
                {
                    missingMappedQuestions.Add(mapping.QuestionNumber);
                    continue;
                }

                var detectedAnswerJson = !string.IsNullOrWhiteSpace(recognized.DetectedAnswerJson)
                    ? recognized.DetectedAnswerJson
                    : JsonSerializer.Serialize(recognized.DetectedOption, JsonOptions);
                var grading = AutoGradeAnswer(item.SnapshotQuestionType, detectedAnswerJson, item.SnapshotAnswerKeyJson, item.Points);
                if (grading.IsCorrect.HasValue)
                {
                    gradedQuestionCount += 1;
                }

                score += grading.EarnedPoints;
                gradedAnswers.Add(new GradedScanAnswer(
                    mapping.AssessmentItemId,
                    mapping.QuestionNumber,
                    recognized.DetectedOption,
                    detectedAnswerJson,
                    grading.IsCorrect,
                    grading.EarnedPoints,
                    string.IsNullOrWhiteSpace(recognized.ConfidenceJson) ? "{}" : recognized.ConfidenceJson));
            }

            return new ScanGradingResult(gradedAnswers, missingMappedQuestions, score, gradedQuestionCount);
        }

        private static (bool? IsCorrect, decimal EarnedPoints) AutoGradeAnswer(
            QuestionType questionType,
            string answerJson,
            string answerKeyJson,
            decimal points)
        {
            if (questionType is QuestionType.MediaBased or QuestionType.MathFormula)
            {
                return (null, 0);
            }

            var correct = questionType switch
            {
                QuestionType.SingleChoice => CompareSingleChoice(answerJson, answerKeyJson),
                QuestionType.TrueFalse => CompareSingleChoice(answerJson, answerKeyJson),
                QuestionType.MultipleChoice => CompareStringSet(answerJson, answerKeyJson),
                QuestionType.Ordering => CompareOrderedList(answerJson, answerKeyJson),
                QuestionType.Matching => CompareJsonObject(answerJson, answerKeyJson),
                _ => CompareJsonRaw(answerJson, answerKeyJson)
            };

            return (correct, correct ? points : 0);
        }

        private static bool CompareSingleChoice(string answerJson, string answerKeyJson)
        {
            return string.Equals(ExtractScalar(answerJson), ExtractScalar(answerKeyJson), StringComparison.OrdinalIgnoreCase);
        }

        private static bool CompareStringSet(string answerJson, string answerKeyJson)
        {
            var answerSet = ExtractArrayValues(answerJson).Select(value => value.ToUpperInvariant()).OrderBy(value => value).ToArray();
            var keySet = ExtractArrayValues(answerKeyJson).Select(value => value.ToUpperInvariant()).OrderBy(value => value).ToArray();
            return answerSet.SequenceEqual(keySet, StringComparer.Ordinal);
        }

        private static bool CompareOrderedList(string answerJson, string answerKeyJson)
        {
            return ExtractArrayValues(answerJson).SequenceEqual(ExtractArrayValues(answerKeyJson), StringComparer.OrdinalIgnoreCase);
        }

        private static bool CompareJsonObject(string answerJson, string answerKeyJson)
        {
            var answerMap = ExtractObjectMap(answerJson);
            var keyMap = ExtractObjectMap(answerKeyJson);
            if (answerMap.Count != keyMap.Count)
            {
                return false;
            }

            foreach (var (key, value) in keyMap)
            {
                if (!answerMap.TryGetValue(key, out var answerValue) ||
                    !string.Equals(answerValue, value, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }

            return true;
        }

        private static bool CompareJsonRaw(string answerJson, string answerKeyJson)
        {
            using var answerDoc = JsonDocument.Parse(string.IsNullOrWhiteSpace(answerJson) ? "{}" : answerJson);
            using var keyDoc = JsonDocument.Parse(string.IsNullOrWhiteSpace(answerKeyJson) ? "{}" : answerKeyJson);
            return string.Equals(
                JsonSerializer.Serialize(answerDoc.RootElement),
                JsonSerializer.Serialize(keyDoc.RootElement),
                StringComparison.Ordinal);
        }

        private static string ExtractScalar(string json)
        {
            using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "\"\"" : json);
            var element = document.RootElement;
            return element.ValueKind switch
            {
                JsonValueKind.String => element.GetString() ?? string.Empty,
                JsonValueKind.Number => element.GetRawText(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Object when element.TryGetProperty("value", out var nestedValue) =>
                    nestedValue.ValueKind == JsonValueKind.String ? nestedValue.GetString() ?? string.Empty : nestedValue.GetRawText(),
                _ => element.GetRawText()
            };
        }

        private static IReadOnlyCollection<string> ExtractArrayValues(string json)
        {
            using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "[]" : json);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<string>();
            }

            return document.RootElement.EnumerateArray()
                .Select(item => item.ValueKind == JsonValueKind.String ? item.GetString() ?? string.Empty : item.GetRawText())
                .ToArray();
        }

        private static IReadOnlyDictionary<string, string> ExtractObjectMap(string json)
        {
            using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            }

            return document.RootElement.EnumerateObject().ToDictionary(
                property => property.Name,
                property => property.Value.ValueKind == JsonValueKind.String ? property.Value.GetString() ?? string.Empty : property.Value.GetRawText(),
                StringComparer.OrdinalIgnoreCase);
        }

        private sealed record GradedScanAnswer(
            Guid AssessmentItemId,
            int QuestionNumber,
            string DetectedOption,
            string DetectedAnswerJson,
            bool? IsCorrect,
            decimal EarnedPoints,
            string ConfidenceJson);

        private sealed record ScanGradingResult(
            IReadOnlyCollection<GradedScanAnswer> Answers,
            IReadOnlyCollection<int> MissingMappedQuestions,
            decimal Score,
            int GradedQuestionCount);
    }
}
