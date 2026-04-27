using examxy.Application.Exceptions;
using examxy.Application.Features.QuestionBank;
using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Domain.QuestionBank;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Features.QuestionBank
{
    public sealed class QuestionBankService : IQuestionBankService
    {
        private readonly AppDbContext _dbContext;

        public QuestionBankService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<QuestionDto> CreateQuestionAsync(
            string teacherUserId,
            CreateQuestionRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            ValidateQuestionStem(request.StemRichText, request.StemPlainText);

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

            question.Versions.Add(new QuestionBankQuestionVersion
            {
                Id = Guid.NewGuid(),
                QuestionId = question.Id,
                VersionNumber = 1,
                QuestionType = ParseQuestionType(request.QuestionType),
                StemRichText = request.StemRichText ?? string.Empty,
                StemPlainText = request.StemPlainText ?? string.Empty,
                ExplanationRichText = request.ExplanationRichText ?? string.Empty,
                Difficulty = request.Difficulty?.Trim() ?? string.Empty,
                EstimatedSeconds = Math.Max(request.EstimatedSeconds, 0),
                ContentJson = request.ContentJson ?? "{}",
                AnswerKeyJson = request.AnswerKeyJson ?? "{}",
                CreatedAtUtc = now,
                Attachments = request.Attachments.Select(attachment => new QuestionBankAttachment
                {
                    Id = Guid.NewGuid(),
                    FileName = attachment.FileName.Trim(),
                    ContentType = attachment.ContentType.Trim(),
                    FileSizeBytes = attachment.FileSizeBytes,
                    ExternalUrl = attachment.ExternalUrl.Trim(),
                    CreatedAtUtc = now
                }).ToArray()
            });

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

        public async Task<QuestionDto> UpdateQuestionAsync(
            string teacherUserId,
            Guid questionId,
            UpdateQuestionRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);
            ValidateQuestionStem(request.StemRichText, request.StemPlainText);

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

            question.Versions.Add(new QuestionBankQuestionVersion
            {
                Id = Guid.NewGuid(),
                QuestionId = question.Id,
                VersionNumber = nextVersionNumber,
                QuestionType = ParseQuestionType(request.QuestionType),
                StemRichText = request.StemRichText ?? string.Empty,
                StemPlainText = request.StemPlainText ?? string.Empty,
                ExplanationRichText = request.ExplanationRichText ?? string.Empty,
                Difficulty = request.Difficulty?.Trim() ?? string.Empty,
                EstimatedSeconds = Math.Max(request.EstimatedSeconds, 0),
                ContentJson = request.ContentJson ?? "{}",
                AnswerKeyJson = request.AnswerKeyJson ?? "{}",
                CreatedAtUtc = now,
                Attachments = request.Attachments.Select(attachment => new QuestionBankAttachment
                {
                    Id = Guid.NewGuid(),
                    FileName = attachment.FileName.Trim(),
                    ContentType = attachment.ContentType.Trim(),
                    FileSizeBytes = attachment.FileSizeBytes,
                    ExternalUrl = attachment.ExternalUrl.Trim(),
                    CreatedAtUtc = now
                }).ToArray()
            });

            question.Status = ParseQuestionStatus(request.Status);
            question.CurrentVersionNumber = nextVersionNumber;
            question.UpdatedAtUtc = now;

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
                    .Select(version => new QuestionVersionDto
                    {
                        Id = version.Id,
                        VersionNumber = version.VersionNumber,
                        QuestionType = version.QuestionType.ToString(),
                        StemRichText = version.StemRichText,
                        StemPlainText = version.StemPlainText,
                        ExplanationRichText = version.ExplanationRichText,
                        Difficulty = version.Difficulty,
                        EstimatedSeconds = version.EstimatedSeconds,
                        ContentJson = version.ContentJson,
                        AnswerKeyJson = version.AnswerKeyJson,
                        Attachments = version.Attachments
                            .OrderBy(attachment => attachment.CreatedAtUtc)
                            .Select(attachment => new QuestionAttachmentDto
                            {
                                Id = attachment.Id,
                                FileName = attachment.FileName,
                                ContentType = attachment.ContentType,
                                FileSizeBytes = attachment.FileSizeBytes,
                                ExternalUrl = attachment.ExternalUrl
                            })
                            .ToArray()
                    })
                    .ToArray(),
                Tags = question.QuestionTags
                    .Select(join => join.Tag.Name)
                    .OrderBy(name => name)
                    .ToArray()
            };
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
