using System.Text.Json;
using examxy.Application.Exceptions;
using examxy.Application.Features.Assessments;
using examxy.Application.Features.Assessments.DTOs;
using examxy.Domain.Assessments;
using examxy.Domain.ClassContent;
using examxy.Domain.Classrooms;
using examxy.Domain.Notifications;
using examxy.Domain.Notifications.Enums;
using examxy.Domain.QuestionBank;
using examxy.Infrastructure.Features.Notifications;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Features.Assessments
{
    public sealed class ClassAssessmentService : IClassAssessmentService
    {
        private readonly AppDbContext _dbContext;

        public ClassAssessmentService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<AssessmentDto> CreateAssessmentAsync(
            string teacherUserId,
            Guid classId,
            CreateAssessmentRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerClassAsync(teacherUserId, classId, cancellationToken);
            ValidateAssessmentTitle(request.Title);

            var now = DateTime.UtcNow;
            var assessment = new ClassAssessment
            {
                Id = Guid.NewGuid(),
                ClassId = classId,
                OwnerTeacherUserId = teacherUserId,
                Title = request.Title.Trim(),
                DescriptionRichText = request.DescriptionRichText ?? string.Empty,
                DescriptionPlainText = request.DescriptionPlainText ?? string.Empty,
                AssessmentKind = ParseAssessmentKind(request.AssessmentKind),
                Status = AssessmentStatus.Draft,
                AttemptLimit = request.AttemptLimit <= 0 ? 1 : request.AttemptLimit,
                TimeLimitMinutes = request.TimeLimitMinutes,
                QuestionOrderMode = ParseQuestionOrderMode(request.QuestionOrderMode),
                ShowAnswersMode = ParseShowAnswersMode(request.ShowAnswersMode),
                ScoreReleaseMode = ParseScoreReleaseMode(request.ScoreReleaseMode),
                PublishAtUtc = request.PublishAtUtc,
                CloseAtUtc = request.CloseAtUtc,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            assessment.Items = (await BuildAssessmentItemsAsync(
                teacherUserId,
                request.Items,
                cancellationToken))
                .ToArray();

            _dbContext.ClassAssessments.Add(assessment);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return await LoadAssessmentDtoAsync(assessment.Id, cancellationToken);
        }

        public async Task<AssessmentDto> UpdateAssessmentAsync(
            string teacherUserId,
            Guid classId,
            Guid assessmentId,
            UpdateAssessmentRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerClassAsync(teacherUserId, classId, cancellationToken);
            ValidateAssessmentTitle(request.Title);

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

            if (assessment.Status != AssessmentStatus.Draft)
            {
                throw new ConflictException(
                    "Assessment content is locked after publish. Only schedule/visibility can be updated.");
            }

            assessment.Title = request.Title.Trim();
            assessment.DescriptionRichText = request.DescriptionRichText ?? string.Empty;
            assessment.DescriptionPlainText = request.DescriptionPlainText ?? string.Empty;
            assessment.AssessmentKind = ParseAssessmentKind(request.AssessmentKind);
            assessment.AttemptLimit = request.AttemptLimit <= 0 ? 1 : request.AttemptLimit;
            assessment.TimeLimitMinutes = request.TimeLimitMinutes;
            assessment.QuestionOrderMode = ParseQuestionOrderMode(request.QuestionOrderMode);
            assessment.ShowAnswersMode = ParseShowAnswersMode(request.ShowAnswersMode);
            assessment.ScoreReleaseMode = ParseScoreReleaseMode(request.ScoreReleaseMode);
            assessment.PublishAtUtc = request.PublishAtUtc;
            assessment.CloseAtUtc = request.CloseAtUtc;
            assessment.UpdatedAtUtc = DateTime.UtcNow;

            if (assessment.Items.Count > 0)
            {
                _dbContext.ClassAssessmentItems.RemoveRange(assessment.Items);
            }

            assessment.Items = (await BuildAssessmentItemsAsync(
                teacherUserId,
                request.Items,
                cancellationToken))
                .ToArray();

            await _dbContext.SaveChangesAsync(cancellationToken);
            return await LoadAssessmentDtoAsync(assessment.Id, cancellationToken);
        }

        public async Task<AssessmentDto> PublishAssessmentAsync(
            string teacherUserId,
            Guid classId,
            Guid assessmentId,
            PublishAssessmentRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherOwnerClassAsync(teacherUserId, classId, cancellationToken);

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

            if (assessment.Status == AssessmentStatus.Closed)
            {
                throw new ConflictException("Closed assessment cannot be modified.");
            }

            if (assessment.Items.Count == 0)
            {
                throw new ValidationException(
                    "Assessment must include at least one item before publish.",
                    new Dictionary<string, string[]>
                    {
                        ["items"] = new[] { "At least one assessment item is required." }
                    });
            }

            var now = DateTime.UtcNow;
            assessment.Status = AssessmentStatus.Published;
            assessment.PublishAtUtc = request.PublishAtUtc;
            assessment.CloseAtUtc = request.CloseAtUtc;
            assessment.ShowAnswersMode = ParseShowAnswersMode(request.ShowAnswersMode);
            assessment.ScoreReleaseMode = ParseScoreReleaseMode(request.ScoreReleaseMode);
            assessment.PublishedAtUtc ??= now;
            assessment.UpdatedAtUtc = now;

            await CreateAssessmentPublishedNotificationsAsync(
                assessment,
                teacherUserId,
                cancellationToken);

            await _dbContext.SaveChangesAsync(cancellationToken);
            return await LoadAssessmentDtoAsync(assessment.Id, cancellationToken);
        }

        public async Task<IReadOnlyCollection<AssessmentDto>> GetClassAssessmentsAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default)
        {
            var access = await EnsureClassAccessAsync(userId, classId, cancellationToken);
            var now = DateTime.UtcNow;

            var query = _dbContext.ClassAssessments
                .Include(assessment => assessment.Items)
                .Where(assessment => assessment.ClassId == classId && assessment.DeletedAtUtc == null);

            if (!access.IsTeacherOwner)
            {
                query = query.Where(assessment =>
                    assessment.Status == AssessmentStatus.Published &&
                    (!assessment.PublishAtUtc.HasValue || assessment.PublishAtUtc <= now) &&
                    (!assessment.CloseAtUtc.HasValue || assessment.CloseAtUtc > now));
            }

            var assessments = await query
                .OrderByDescending(assessment => assessment.PublishAtUtc ?? assessment.CreatedAtUtc)
                .ThenByDescending(assessment => assessment.CreatedAtUtc)
                .ToArrayAsync(cancellationToken);

            return assessments.Select(MapAssessment).ToArray();
        }

        public Task<StudentAssessmentAttemptDto> StartAttemptAsync(
            string userId,
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken = default)
        {
            return StartAttemptCoreAsync(userId, classId, assessmentId, cancellationToken);
        }

        public Task<StudentAssessmentAttemptDto> SaveAnswersAsync(
            string userId,
            Guid classId,
            Guid attemptId,
            SaveAttemptAnswersRequestDto request,
            CancellationToken cancellationToken = default)
        {
            return SaveAnswersCoreAsync(userId, classId, attemptId, request, cancellationToken);
        }

        public Task<StudentAssessmentAttemptDto> SubmitAttemptAsync(
            string userId,
            Guid classId,
            Guid attemptId,
            CancellationToken cancellationToken = default)
        {
            return SubmitAttemptCoreAsync(userId, classId, attemptId, cancellationToken);
        }

        public Task<IReadOnlyCollection<StudentAssessmentAttemptDto>> GetAssessmentResultsAsync(
            string teacherUserId,
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken = default)
        {
            return GetAssessmentResultsCoreAsync(teacherUserId, classId, assessmentId, cancellationToken);
        }

        private Task<IReadOnlyCollection<ClassAssessmentItem>> BuildAssessmentItemsAsync(
            string teacherUserId,
            IReadOnlyCollection<CreateAssessmentItemRequestDto> requests,
            CancellationToken cancellationToken)
        {
            return BuildAssessmentItemsCoreAsync(teacherUserId, requests, cancellationToken);
        }

        private Task<(QuestionBankQuestion Question, QuestionBankQuestionVersion Version)> LoadSourceQuestionVersionAsync(
            string teacherUserId,
            Guid questionId,
            Guid? questionVersionId,
            CancellationToken cancellationToken)
        {
            return LoadSourceQuestionVersionCoreAsync(
                teacherUserId,
                questionId,
                questionVersionId,
                cancellationToken);
        }

        private async Task<StudentAssessmentAttemptDto> StartAttemptCoreAsync(
            string userId,
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            await EnsureStudentMemberClassAsync(userId, classId, cancellationToken);

            var assessment = await _dbContext.ClassAssessments
                .Include(candidate => candidate.Items)
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
                throw new ConflictException("Assessment is not available for attempt.");
            }

            var inProgress = await _dbContext.StudentAssessmentAttempts
                .Include(candidate => candidate.Answers)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.AssessmentId == assessmentId &&
                        candidate.ClassId == classId &&
                        candidate.StudentUserId == userId &&
                        candidate.Status == StudentAssessmentAttemptStatus.InProgress,
                    cancellationToken);

            if (inProgress is not null)
            {
                return MapAttempt(inProgress);
            }

            var attemptCount = await _dbContext.StudentAssessmentAttempts.CountAsync(
                candidate =>
                    candidate.AssessmentId == assessmentId &&
                    candidate.ClassId == classId &&
                    candidate.StudentUserId == userId,
                cancellationToken);

            if (attemptCount >= assessment.AttemptLimit)
            {
                throw new ConflictException("Attempt limit reached.");
            }

            var attempt = new StudentAssessmentAttempt
            {
                Id = Guid.NewGuid(),
                AssessmentId = assessment.Id,
                ClassId = classId,
                StudentUserId = userId,
                AttemptNumber = attemptCount + 1,
                Status = StudentAssessmentAttemptStatus.InProgress,
                StartedAtUtc = now,
                TimeLimitMinutesSnapshot = assessment.TimeLimitMinutes,
                MaxScore = assessment.Items.Sum(item => item.Points),
                EarnedScore = 0,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            _dbContext.StudentAssessmentAttempts.Add(attempt);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return MapAttempt(attempt);
        }

        private async Task<StudentAssessmentAttemptDto> SaveAnswersCoreAsync(
            string userId,
            Guid classId,
            Guid attemptId,
            SaveAttemptAnswersRequestDto request,
            CancellationToken cancellationToken)
        {
            await EnsureStudentMemberClassAsync(userId, classId, cancellationToken);

            var attempt = await _dbContext.StudentAssessmentAttempts
                .Include(candidate => candidate.Assessment)
                    .ThenInclude(assessment => assessment.Items)
                .Include(candidate => candidate.Answers)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == attemptId &&
                        candidate.ClassId == classId &&
                        candidate.StudentUserId == userId,
                    cancellationToken);

            if (attempt is null)
            {
                throw new NotFoundException("Attempt not found.");
            }

            if (attempt.Status != StudentAssessmentAttemptStatus.InProgress)
            {
                throw new ConflictException("Only in-progress attempts can be edited.");
            }

            var itemIds = attempt.Assessment.Items.Select(item => item.Id).ToHashSet();
            var now = DateTime.UtcNow;

            foreach (var item in request.Items)
            {
                if (!itemIds.Contains(item.AssessmentItemId))
                {
                    throw new ValidationException(
                        "Answer item does not belong to assessment.",
                        new Dictionary<string, string[]>
                        {
                            ["items"] = new[] { "AssessmentItemId is invalid for this attempt." }
                        });
                }

                var answer = attempt.Answers.FirstOrDefault(
                    candidate => candidate.AssessmentItemId == item.AssessmentItemId);

                if (answer is null)
                {
                    answer = new StudentAssessmentAnswer
                    {
                        Id = Guid.NewGuid(),
                        AttemptId = attempt.Id,
                        AssessmentItemId = item.AssessmentItemId,
                        QuestionType = ParseQuestionType(item.QuestionType),
                        AnswerJson = item.AnswerJson ?? "{}",
                        CreatedAtUtc = now,
                        UpdatedAtUtc = now
                    };

                    _dbContext.StudentAssessmentAnswers.Add(answer);
                    attempt.Answers.Add(answer);
                }
                else
                {
                    answer.QuestionType = ParseQuestionType(item.QuestionType);
                    answer.AnswerJson = item.AnswerJson ?? "{}";
                    answer.UpdatedAtUtc = now;
                }
            }

            attempt.UpdatedAtUtc = now;
            await _dbContext.SaveChangesAsync(cancellationToken);
            return MapAttempt(attempt);
        }

        private async Task<StudentAssessmentAttemptDto> SubmitAttemptCoreAsync(
            string userId,
            Guid classId,
            Guid attemptId,
            CancellationToken cancellationToken)
        {
            await EnsureStudentMemberClassAsync(userId, classId, cancellationToken);

            var attempt = await _dbContext.StudentAssessmentAttempts
                .Include(candidate => candidate.Assessment)
                    .ThenInclude(assessment => assessment.Items)
                .Include(candidate => candidate.Answers)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == attemptId &&
                        candidate.ClassId == classId &&
                        candidate.StudentUserId == userId,
                    cancellationToken);

            if (attempt is null)
            {
                throw new NotFoundException("Attempt not found.");
            }

            if (attempt.Status != StudentAssessmentAttemptStatus.InProgress)
            {
                throw new ConflictException("Attempt has already been submitted.");
            }

            var now = DateTime.UtcNow;
            if (attempt.Assessment.CloseAtUtc.HasValue && attempt.Assessment.CloseAtUtc <= now)
            {
                throw new ConflictException("Assessment is closed.");
            }

            decimal maxScore = 0;
            decimal earnedScore = 0;

            foreach (var item in attempt.Assessment.Items.OrderBy(item => item.DisplayOrder))
            {
                maxScore += item.Points;

                var answer = attempt.Answers.FirstOrDefault(candidate => candidate.AssessmentItemId == item.Id);
                if (answer is null)
                {
                    answer = new StudentAssessmentAnswer
                    {
                        Id = Guid.NewGuid(),
                        AttemptId = attempt.Id,
                        AssessmentItemId = item.Id,
                        QuestionType = item.SnapshotQuestionType,
                        AnswerJson = "{}",
                        CreatedAtUtc = now,
                        UpdatedAtUtc = now
                    };

                    _dbContext.StudentAssessmentAnswers.Add(answer);
                    attempt.Answers.Add(answer);
                }

                var (isCorrect, points) = AutoGradeAnswer(
                    item.SnapshotQuestionType,
                    answer.AnswerJson,
                    item.SnapshotAnswerKeyJson,
                    item.Points);

                answer.QuestionType = item.SnapshotQuestionType;
                answer.IsCorrect = isCorrect;
                answer.EarnedPoints = points;
                answer.AutoGradedAtUtc = now;
                answer.UpdatedAtUtc = now;

                earnedScore += points;
            }

            attempt.Status = StudentAssessmentAttemptStatus.AutoGraded;
            attempt.SubmittedAtUtc = now;
            attempt.AutoGradedAtUtc = now;
            attempt.MaxScore = maxScore;
            attempt.EarnedScore = earnedScore;
            attempt.UpdatedAtUtc = now;

            await _dbContext.SaveChangesAsync(cancellationToken);
            return MapAttempt(attempt);
        }

        private async Task<IReadOnlyCollection<StudentAssessmentAttemptDto>> GetAssessmentResultsCoreAsync(
            string teacherUserId,
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            await EnsureTeacherOwnerClassAsync(teacherUserId, classId, cancellationToken);

            var attempts = await _dbContext.StudentAssessmentAttempts
                .Include(attempt => attempt.Answers)
                .Where(attempt =>
                    attempt.AssessmentId == assessmentId &&
                    attempt.ClassId == classId)
                .OrderByDescending(attempt => attempt.CreatedAtUtc)
                .ThenByDescending(attempt => attempt.AttemptNumber)
                .ToArrayAsync(cancellationToken);

            return attempts.Select(MapAttempt).ToArray();
        }

        private async Task<IReadOnlyCollection<ClassAssessmentItem>> BuildAssessmentItemsCoreAsync(
            string teacherUserId,
            IReadOnlyCollection<CreateAssessmentItemRequestDto> requests,
            CancellationToken cancellationToken)
        {
            if (requests.Count == 0)
            {
                return Array.Empty<ClassAssessmentItem>();
            }

            var items = new List<ClassAssessmentItem>(requests.Count);
            var orderedRequests = requests
                .OrderBy(request => request.DisplayOrder)
                .ToArray();

            for (var index = 0; index < orderedRequests.Length; index++)
            {
                var request = orderedRequests[index];
                var displayOrder = index + 1;

                if (request.SourceQuestionId.HasValue)
                {
                    var (question, version) = await LoadSourceQuestionVersionAsync(
                        teacherUserId,
                        request.SourceQuestionId.Value,
                        request.SourceQuestionVersionId,
                        cancellationToken);

                    question.LastUsedAtUtc = DateTime.UtcNow;
                    question.UpdatedAtUtc = DateTime.UtcNow;

                    items.Add(new ClassAssessmentItem
                    {
                        Id = Guid.NewGuid(),
                        DisplayOrder = displayOrder,
                        SourceQuestionId = question.Id,
                        SourceQuestionVersionId = version.Id,
                        Points = request.Points <= 0 ? 1 : request.Points,
                        SnapshotQuestionType = version.QuestionType,
                        SnapshotStemRichText = version.StemRichText,
                        SnapshotStemPlainText = version.StemPlainText,
                        SnapshotContentJson = version.ContentJson,
                        SnapshotAnswerKeyJson = version.AnswerKeyJson,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }
                else
                {
                    items.Add(new ClassAssessmentItem
                    {
                        Id = Guid.NewGuid(),
                        DisplayOrder = displayOrder,
                        SourceQuestionId = null,
                        SourceQuestionVersionId = null,
                        Points = request.Points <= 0 ? 1 : request.Points,
                        SnapshotQuestionType = ParseQuestionType(request.SnapshotQuestionType),
                        SnapshotStemRichText = request.SnapshotStemRichText ?? string.Empty,
                        SnapshotStemPlainText = request.SnapshotStemPlainText ?? string.Empty,
                        SnapshotContentJson = request.SnapshotContentJson ?? "{}",
                        SnapshotAnswerKeyJson = request.SnapshotAnswerKeyJson ?? "{}",
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }
            }

            return items;
        }

        private async Task<(QuestionBankQuestion Question, QuestionBankQuestionVersion Version)> LoadSourceQuestionVersionCoreAsync(
            string teacherUserId,
            Guid questionId,
            Guid? questionVersionId,
            CancellationToken cancellationToken)
        {
            var question = await _dbContext.QuestionBankQuestions
                .Include(candidate => candidate.Versions)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == questionId &&
                        candidate.OwnerTeacherUserId == teacherUserId &&
                        candidate.DeletedAtUtc == null,
                    cancellationToken);

            if (question is null)
            {
                throw new ValidationException(
                    "Question source is invalid.",
                    new Dictionary<string, string[]>
                    {
                        ["sourceQuestionId"] = new[] { "Source question was not found." }
                    });
            }

            QuestionBankQuestionVersion? version;
            if (questionVersionId.HasValue)
            {
                version = question.Versions.FirstOrDefault(candidate => candidate.Id == questionVersionId.Value);
            }
            else
            {
                version = question.Versions.FirstOrDefault(
                    candidate => candidate.VersionNumber == question.CurrentVersionNumber);
            }

            if (version is null)
            {
                throw new ValidationException(
                    "Question version is invalid.",
                    new Dictionary<string, string[]>
                    {
                        ["sourceQuestionVersionId"] = new[] { "Source question version was not found." }
                    });
            }

            return (question, version);
        }

        private Task<ClassAccessContext> EnsureClassAccessAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            return EnsureClassAccessCoreAsync(userId, classId, cancellationToken);
        }

        private Task<Classroom> EnsureTeacherOwnerClassAsync(
            string teacherUserId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            return EnsureTeacherOwnerClassCoreAsync(teacherUserId, classId, cancellationToken);
        }

        private Task EnsureStudentMemberClassAsync(
            string studentUserId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            return EnsureStudentMemberClassCoreAsync(studentUserId, classId, cancellationToken);
        }

        private Task<AssessmentDto> LoadAssessmentDtoAsync(
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            return LoadAssessmentDtoCoreAsync(assessmentId, cancellationToken);
        }

        private Task CreateAssessmentPublishedNotificationsAsync(
            ClassAssessment assessment,
            string teacherUserId,
            CancellationToken cancellationToken)
        {
            return CreateAssessmentPublishedNotificationsCoreAsync(
                assessment,
                teacherUserId,
                cancellationToken);
        }

        private async Task<ClassAccessContext> EnsureClassAccessCoreAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(candidate => candidate.Id == classId, cancellationToken);

            if (classroom is null)
            {
                throw new NotFoundException("Class not found.");
            }

            if (string.Equals(classroom.OwnerTeacherUserId, userId, StringComparison.Ordinal))
            {
                return new ClassAccessContext(classroom, isTeacherOwner: true);
            }

            var isMember = await _dbContext.ClassMemberships.AnyAsync(
                membership =>
                    membership.ClassId == classId &&
                    membership.StudentUserId == userId &&
                    membership.Status == ClassMembershipStatus.Active,
                cancellationToken);

            if (!isMember)
            {
                throw new ForbiddenException("You do not have access to this class.");
            }

            return new ClassAccessContext(classroom, isTeacherOwner: false);
        }

        private async Task<Classroom> EnsureTeacherOwnerClassCoreAsync(
            string teacherUserId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == classId &&
                        candidate.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (classroom is null)
            {
                throw new NotFoundException("Class not found.");
            }

            return classroom;
        }

        private async Task EnsureStudentMemberClassCoreAsync(
            string studentUserId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            var isMember = await _dbContext.ClassMemberships.AnyAsync(
                membership =>
                    membership.ClassId == classId &&
                    membership.StudentUserId == studentUserId &&
                    membership.Status == ClassMembershipStatus.Active,
                cancellationToken);

            if (!isMember)
            {
                throw new ForbiddenException("Only class students can submit assessment attempts.");
            }
        }

        private async Task<AssessmentDto> LoadAssessmentDtoCoreAsync(
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            var assessment = await _dbContext.ClassAssessments
                .Include(candidate => candidate.Items)
                .FirstOrDefaultAsync(candidate => candidate.Id == assessmentId, cancellationToken);

            if (assessment is null)
            {
                throw new NotFoundException("Assessment not found.");
            }

            return MapAssessment(assessment);
        }

        private async Task CreateAssessmentPublishedNotificationsCoreAsync(
            ClassAssessment assessment,
            string teacherUserId,
            CancellationToken cancellationToken)
        {
            var recipients = await _dbContext.ClassMemberships
                .Where(membership =>
                    membership.ClassId == assessment.ClassId &&
                    membership.Status == ClassMembershipStatus.Active)
                .Select(membership => membership.StudentUserId)
                .ToArrayAsync(cancellationToken);

            if (recipients.Length == 0)
            {
                return;
            }

            var keys = recipients
                .Select(recipient => BuildAssessmentPublishNotificationKey(assessment.Id, recipient))
                .ToArray();

            var existing = await _dbContext.UserNotifications
                .Where(notification => keys.Contains(notification.NotificationKey))
                .Select(notification => notification.NotificationKey)
                .ToArrayAsync(cancellationToken);

            var existingSet = new HashSet<string>(existing, StringComparer.Ordinal);
            var now = DateTime.UtcNow;
            var route = NotificationLinkResolver.ForAssessment(assessment.ClassId, assessment.Id);

            foreach (var recipient in recipients)
            {
                var key = BuildAssessmentPublishNotificationKey(assessment.Id, recipient);
                if (existingSet.Contains(key))
                {
                    continue;
                }

                _dbContext.UserNotifications.Add(new UserNotification
                {
                    Id = Guid.NewGuid(),
                    ClassId = assessment.ClassId,
                    RecipientUserId = recipient,
                    ActorUserId = teacherUserId,
                    NotificationType = NotificationType.AssessmentPublished,
                    SourceType = NotificationSourceType.Assessment,
                    SourceId = assessment.Id,
                    Title = Truncate(assessment.Title, 200),
                    Message = "A new assessment has been published.",
                    LinkPath = route.LinkPath,
                    PayloadJson = route.PayloadJson,
                    NotificationKey = key,
                    IsRead = false,
                    CreatedAtUtc = now
                });
            }
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
            return string.Equals(
                ExtractScalar(answerJson),
                ExtractScalar(answerKeyJson),
                StringComparison.OrdinalIgnoreCase);
        }

        private static bool CompareStringSet(string answerJson, string answerKeyJson)
        {
            var answerSet = ExtractArrayValues(answerJson)
                .Select(value => value.ToUpperInvariant())
                .OrderBy(value => value)
                .ToArray();
            var keySet = ExtractArrayValues(answerKeyJson)
                .Select(value => value.ToUpperInvariant())
                .OrderBy(value => value)
                .ToArray();

            return answerSet.SequenceEqual(keySet, StringComparer.Ordinal);
        }

        private static bool CompareOrderedList(string answerJson, string answerKeyJson)
        {
            var answer = ExtractArrayValues(answerJson);
            var key = ExtractArrayValues(answerKeyJson);
            return answer.SequenceEqual(key, StringComparer.OrdinalIgnoreCase);
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
                if (!answerMap.TryGetValue(key, out var answerValue))
                {
                    return false;
                }

                if (!string.Equals(answerValue, value, StringComparison.OrdinalIgnoreCase))
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

            var normalizedAnswer = JsonSerializer.Serialize(answerDoc.RootElement);
            var normalizedKey = JsonSerializer.Serialize(keyDoc.RootElement);
            return string.Equals(normalizedAnswer, normalizedKey, StringComparison.Ordinal);
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
                JsonValueKind.Object when element.TryGetProperty("value", out var valueElement) =>
                    valueElement.ValueKind == JsonValueKind.String
                        ? valueElement.GetString() ?? string.Empty
                        : valueElement.GetRawText(),
                _ => element.GetRawText()
            };
        }

        private static IReadOnlyCollection<string> ExtractArrayValues(string json)
        {
            using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "[]" : json);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<string>();
            }

            return root.EnumerateArray()
                .Select(item => item.ValueKind == JsonValueKind.String ? item.GetString() ?? string.Empty : item.GetRawText())
                .ToArray();
        }

        private static IReadOnlyDictionary<string, string> ExtractObjectMap(string json)
        {
            using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            }

            return root.EnumerateObject()
                .ToDictionary(
                    property => property.Name,
                    property => property.Value.ValueKind == JsonValueKind.String
                        ? property.Value.GetString() ?? string.Empty
                        : property.Value.GetRawText(),
                    StringComparer.OrdinalIgnoreCase);
        }

        private static string BuildAssessmentPublishNotificationKey(
            Guid assessmentId,
            string recipientUserId)
        {
            return $"assessment:{assessmentId:N}:published:{recipientUserId}";
        }

        private static AssessmentDto MapAssessment(ClassAssessment assessment)
        {
            return new AssessmentDto
            {
                Id = assessment.Id,
                ClassId = assessment.ClassId,
                Title = assessment.Title,
                DescriptionRichText = assessment.DescriptionRichText,
                DescriptionPlainText = assessment.DescriptionPlainText,
                AssessmentKind = assessment.AssessmentKind.ToString(),
                Status = assessment.Status.ToString(),
                AttemptLimit = assessment.AttemptLimit,
                TimeLimitMinutes = assessment.TimeLimitMinutes,
                QuestionOrderMode = assessment.QuestionOrderMode.ToString(),
                ShowAnswersMode = assessment.ShowAnswersMode.ToString(),
                ScoreReleaseMode = assessment.ScoreReleaseMode.ToString(),
                PublishAtUtc = assessment.PublishAtUtc,
                CloseAtUtc = assessment.CloseAtUtc,
                PublishedAtUtc = assessment.PublishedAtUtc,
                CreatedAtUtc = assessment.CreatedAtUtc,
                UpdatedAtUtc = assessment.UpdatedAtUtc,
                Items = assessment.Items
                    .OrderBy(item => item.DisplayOrder)
                    .Select(item => new AssessmentItemDto
                    {
                        Id = item.Id,
                        DisplayOrder = item.DisplayOrder,
                        SourceQuestionId = item.SourceQuestionId,
                        SourceQuestionVersionId = item.SourceQuestionVersionId,
                        Points = item.Points,
                        SnapshotQuestionType = item.SnapshotQuestionType.ToString(),
                        SnapshotStemRichText = item.SnapshotStemRichText,
                        SnapshotStemPlainText = item.SnapshotStemPlainText,
                        SnapshotContentJson = item.SnapshotContentJson,
                        SnapshotAnswerKeyJson = item.SnapshotAnswerKeyJson
                    })
                    .ToArray()
            };
        }

        private static StudentAssessmentAttemptDto MapAttempt(StudentAssessmentAttempt attempt)
        {
            return new StudentAssessmentAttemptDto
            {
                Id = attempt.Id,
                AssessmentId = attempt.AssessmentId,
                ClassId = attempt.ClassId,
                AttemptNumber = attempt.AttemptNumber,
                Status = attempt.Status.ToString(),
                StartedAtUtc = attempt.StartedAtUtc,
                SubmittedAtUtc = attempt.SubmittedAtUtc,
                AutoGradedAtUtc = attempt.AutoGradedAtUtc,
                TimeLimitMinutesSnapshot = attempt.TimeLimitMinutesSnapshot,
                MaxScore = attempt.MaxScore,
                EarnedScore = attempt.EarnedScore,
                Answers = attempt.Answers
                    .OrderBy(answer => answer.CreatedAtUtc)
                    .Select(answer => new StudentAssessmentAnswerDto
                    {
                        Id = answer.Id,
                        AssessmentItemId = answer.AssessmentItemId,
                        QuestionType = answer.QuestionType.ToString(),
                        AnswerJson = answer.AnswerJson,
                        IsCorrect = answer.IsCorrect,
                        EarnedPoints = answer.EarnedPoints
                    })
                    .ToArray()
            };
        }

        private static AssessmentKind ParseAssessmentKind(string value)
        {
            if (Enum.TryParse<AssessmentKind>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Assessment kind is invalid.",
                new Dictionary<string, string[]>
                {
                    ["assessmentKind"] = new[] { "AssessmentKind must be Practice or Test." }
                });
        }

        private static AssessmentQuestionOrderMode ParseQuestionOrderMode(string value)
        {
            if (Enum.TryParse<AssessmentQuestionOrderMode>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Question order mode is invalid.",
                new Dictionary<string, string[]>
                {
                    ["questionOrderMode"] = new[] { "QuestionOrderMode must be Fixed or Random." }
                });
        }

        private static AssessmentShowAnswersMode ParseShowAnswersMode(string value)
        {
            if (Enum.TryParse<AssessmentShowAnswersMode>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Show answers mode is invalid.",
                new Dictionary<string, string[]>
                {
                    ["showAnswersMode"] = new[] { "ShowAnswersMode value is not supported." }
                });
        }

        private static AssessmentScoreReleaseMode ParseScoreReleaseMode(string value)
        {
            if (Enum.TryParse<AssessmentScoreReleaseMode>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Score release mode is invalid.",
                new Dictionary<string, string[]>
                {
                    ["scoreReleaseMode"] = new[] { "ScoreReleaseMode value is not supported." }
                });
        }

        private static QuestionType ParseQuestionType(string value)
        {
            if (Enum.TryParse<QuestionType>(value, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Question type is invalid.",
                new Dictionary<string, string[]>
                {
                    ["questionType"] = new[] { "Question type is not supported." }
                });
        }

        private static void ValidateAssessmentTitle(string title)
        {
            if (!string.IsNullOrWhiteSpace(title))
            {
                return;
            }

            throw new ValidationException(
                "Assessment title is required.",
                new Dictionary<string, string[]>
                {
                    ["title"] = new[] { "Assessment title cannot be empty." }
                });
        }

        private static string Truncate(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value) || value.Length <= maxLength)
            {
                return value;
            }

            return value[..maxLength];
        }

        private sealed class ClassAccessContext
        {
            public ClassAccessContext(
                Classroom classroom,
                bool isTeacherOwner)
            {
                Classroom = classroom;
                IsTeacherOwner = isTeacherOwner;
            }

            public Classroom Classroom { get; }
            public bool IsTeacherOwner { get; }
        }
    }
}
