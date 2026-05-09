using examxy.Application.Features.PaperExams;
using examxy.Application.Features.QuestionBank;
using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Domain.QuestionBank;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace examxy.Infrastructure.Features.QuestionBank
{
    public sealed class QuestionBankExportProcessor : IQuestionBankExportProcessor
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AppDbContext _dbContext;
        private readonly IPaperExamStorage _storage;
        private readonly IQuestionBankAttachmentStorage _attachmentStorage;
        private readonly IQuestionBankPdfCompiler _compiler;

        public QuestionBankExportProcessor(
            AppDbContext dbContext,
            IPaperExamStorage storage,
            IQuestionBankAttachmentStorage attachmentStorage,
            IQuestionBankPdfCompiler compiler)
        {
            _dbContext = dbContext;
            _storage = storage;
            _attachmentStorage = attachmentStorage;
            _compiler = compiler;
        }

        public async Task<QuestionBankExportJobDto?> ProcessNextQueuedJobAsync(
            CancellationToken cancellationToken = default)
        {
            var jobId = await _dbContext.QuestionBankExportJobs
                .Where(job => job.Status == QuestionBankExportJobStatus.Queued)
                .OrderBy(job => job.CreatedAtUtc)
                .Select(job => (Guid?)job.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return jobId.HasValue
                ? await ProcessJobAsync(jobId.Value, cancellationToken)
                : null;
        }

        public async Task<QuestionBankExportJobDto> ProcessJobAsync(
            Guid exportJobId,
            CancellationToken cancellationToken = default)
        {
            var job = await LoadJobAsync(exportJobId, cancellationToken);
            if (job.Status is QuestionBankExportJobStatus.Completed or QuestionBankExportJobStatus.Failed or QuestionBankExportJobStatus.Cancelled)
            {
                return MapExportJob(job);
            }

            job.Status = QuestionBankExportJobStatus.Rendering;
            job.StartedAtUtc ??= DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            try
            {
                var options = ReadOptions(job.OptionsJson);
                var renderResult = await RenderJobAsync(job, options, cancellationToken);
                await SaveLatexArtifactAsync(job, renderResult.LatexDocument, cancellationToken);

                if (renderResult.Errors.Count > 0)
                {
                    MarkFailed(job, renderResult.Errors);
                    await SaveCompileLogArtifactAsync(job, "Rendering failed before PDF compilation.", cancellationToken);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                    return MapExportJob(job);
                }

                job.Status = QuestionBankExportJobStatus.Compiling;
                await _dbContext.SaveChangesAsync(cancellationToken);

                var compileResult = await _compiler.CompileAsync(
                    renderResult.LatexDocument,
                    renderResult.Assets,
                    cancellationToken);

                await SaveCompileLogArtifactAsync(job, compileResult.Log, cancellationToken);
                if (!compileResult.Succeeded)
                {
                    MarkFailed(
                        job,
                        new[]
                        {
                            new QuestionBankExportErrorDto
                            {
                                Code = string.IsNullOrWhiteSpace(compileResult.ErrorCode) ? "PdfCompileFailed" : compileResult.ErrorCode,
                                Message = string.IsNullOrWhiteSpace(compileResult.ErrorMessage) ? "PDF compilation failed." : compileResult.ErrorMessage
                            }
                        });
                    await _dbContext.SaveChangesAsync(cancellationToken);
                    return MapExportJob(job);
                }

                await SavePdfArtifactAsync(job, compileResult.PdfBytes, cancellationToken);
                job.Status = QuestionBankExportJobStatus.Completed;
                job.ErrorJson = "[]";
                job.CompletedAtUtc = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
                return MapExportJob(job);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                MarkFailed(
                    job,
                    new[]
                    {
                        new QuestionBankExportErrorDto
                        {
                            Code = "ExportProcessingFailed",
                            Message = exception.Message
                        }
                    });
                await SaveCompileLogArtifactAsync(job, exception.ToString(), cancellationToken);
                await _dbContext.SaveChangesAsync(cancellationToken);
                return MapExportJob(job);
            }
        }

        private async Task<QuestionBankExportJob> LoadJobAsync(
            Guid exportJobId,
            CancellationToken cancellationToken)
        {
            var job = await _dbContext.QuestionBankExportJobs
                .Include(candidate => candidate.Files)
                .Include(candidate => candidate.Items)
                    .ThenInclude(item => item.QuestionVersion)
                        .ThenInclude(version => version.Attachments)
                .FirstOrDefaultAsync(candidate => candidate.Id == exportJobId, cancellationToken);

            if (job is null)
            {
                throw new InvalidOperationException("Question bank export job was not found.");
            }

            return job;
        }

        private async Task<RenderedExportJob> RenderJobAsync(
            QuestionBankExportJob job,
            QuestionBankExportOptionsDto options,
            CancellationToken cancellationToken)
        {
            var renderedItems = new List<string>();
            var errors = new List<QuestionBankExportErrorDto>();
            var assets = new Dictionary<string, QuestionBankPdfCompilerAsset>(StringComparer.OrdinalIgnoreCase);

            foreach (var item in job.Items.OrderBy(item => item.OrderIndex))
            {
                var attachments = item.QuestionVersion.Attachments
                    .Where(attachment => !string.IsNullOrWhiteSpace(attachment.StorageKey))
                    .ToDictionary(attachment => attachment.Id);
                var rendered = QuestionLatexRenderer.Render(
                    item.QuestionVersion,
                    options.IncludeAnswers,
                    options.IncludeExplanations,
                    attachments);

                item.RenderedLatexFragment = rendered.Fragment;
                item.WarningsJson = JsonSerializer.Serialize(
                    rendered.Warnings.Select(warning => warning.Message),
                    JsonOptions);
                renderedItems.Add(rendered.Fragment);
                errors.AddRange(rendered.Errors.Select(error => new QuestionBankExportErrorDto
                {
                    QuestionVersionId = error.QuestionVersionId,
                    Code = error.Code,
                    Message = $"{error.Message} ({error.Path})"
                }));

                if (rendered.Errors.Count > 0)
                {
                    continue;
                }

                foreach (var attachment in attachments.Values)
                {
                    var relativePath = BuildAttachmentRelativePath(attachment);
                    if (assets.ContainsKey(relativePath))
                    {
                        continue;
                    }

                    await using var stored = (await _attachmentStorage.OpenReadAsync(
                        attachment.StorageKey,
                        cancellationToken)).Content;
                    await using var memory = new MemoryStream();
                    await stored.CopyToAsync(memory, cancellationToken);
                    assets[relativePath] = new QuestionBankPdfCompilerAsset
                    {
                        RelativePath = relativePath,
                        Content = memory.ToArray()
                    };
                }
            }

            var latexDocument = QuestionLatexRenderer.BuildExamDocument(
                string.IsNullOrWhiteSpace(job.Title) ? "DE KIEM TRA" : job.Title,
                renderedItems,
                options);

            return new RenderedExportJob(latexDocument, assets.Values.ToArray(), errors);
        }

        private async Task SaveLatexArtifactAsync(
            QuestionBankExportJob job,
            string latexDocument,
            CancellationToken cancellationToken)
        {
            await using var stream = new MemoryStream(Encoding.UTF8.GetBytes(latexDocument));
            var (storageKey, _) = await _storage.SaveArtifactAsync(
                job.Id,
                "question-bank-export.tex",
                "application/x-tex",
                stream,
                cancellationToken);

            job.GeneratedLatexStorageKey = storageKey;
            UpsertFile(_dbContext, job, "question-bank-export.tex", "application/x-tex", Encoding.UTF8.GetByteCount(latexDocument), storageKey);
        }

        private async Task SavePdfArtifactAsync(
            QuestionBankExportJob job,
            byte[] pdfBytes,
            CancellationToken cancellationToken)
        {
            await using var stream = new MemoryStream(pdfBytes, writable: false);
            var (storageKey, _) = await _storage.SaveArtifactAsync(
                job.Id,
                "question-bank-export.pdf",
                "application/pdf",
                stream,
                cancellationToken);

            job.PdfStorageKey = storageKey;
            UpsertFile(_dbContext, job, "question-bank-export.pdf", "application/pdf", pdfBytes.LongLength, storageKey);
        }

        private async Task SaveCompileLogArtifactAsync(
            QuestionBankExportJob job,
            string log,
            CancellationToken cancellationToken)
        {
            await using var stream = new MemoryStream(Encoding.UTF8.GetBytes(log));
            var (storageKey, _) = await _storage.SaveArtifactAsync(
                job.Id,
                "question-bank-export.log",
                "text/plain",
                stream,
                cancellationToken);

            job.CompileLogStorageKey = storageKey;
            UpsertFile(_dbContext, job, "question-bank-export.log", "text/plain", Encoding.UTF8.GetByteCount(log), storageKey);
        }

        private static void UpsertFile(
            AppDbContext dbContext,
            QuestionBankExportJob job,
            string fileName,
            string contentType,
            long sizeBytes,
            string storageKey)
        {
            var file = job.Files.FirstOrDefault(candidate => candidate.ContentType == contentType);
            if (file is null)
            {
                file = new QuestionBankExportFile
                {
                    Id = Guid.NewGuid(),
                    ExportJobId = job.Id,
                    CreatedAtUtc = DateTime.UtcNow
                };
                dbContext.QuestionBankExportFiles.Add(file);
                job.Files.Add(file);
            }

            file.FileName = fileName;
            file.ContentType = contentType;
            file.SizeBytes = sizeBytes;
            file.StorageKey = storageKey;
        }

        private static void MarkFailed(
            QuestionBankExportJob job,
            IReadOnlyCollection<QuestionBankExportErrorDto> errors)
        {
            job.Status = QuestionBankExportJobStatus.Failed;
            job.ErrorJson = JsonSerializer.Serialize(errors, JsonOptions);
            job.CompletedAtUtc = DateTime.UtcNow;
        }

        private static QuestionBankExportOptionsDto ReadOptions(string json)
        {
            try
            {
                return JsonSerializer.Deserialize<QuestionBankExportOptionsDto>(
                    string.IsNullOrWhiteSpace(json) ? "{}" : json,
                    JsonOptions) ?? new QuestionBankExportOptionsDto();
            }
            catch (JsonException)
            {
                return new QuestionBankExportOptionsDto();
            }
        }

        private static string BuildAttachmentRelativePath(QuestionBankAttachment attachment)
        {
            return $"attachments/{attachment.Id}{GetAttachmentExtension(attachment)}";
        }

        private static string GetAttachmentExtension(QuestionBankAttachment attachment)
        {
            var extension = Path.GetExtension(attachment.FileName);
            if (!string.IsNullOrWhiteSpace(extension))
            {
                return extension;
            }

            return attachment.ContentType.ToLowerInvariant() switch
            {
                "image/png" => ".png",
                "image/jpeg" => ".jpg",
                "image/webp" => ".webp",
                _ => ".bin"
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

        private sealed record RenderedExportJob(
            string LatexDocument,
            IReadOnlyCollection<QuestionBankPdfCompilerAsset> Assets,
            IReadOnlyCollection<QuestionBankExportErrorDto> Errors);
    }
}
