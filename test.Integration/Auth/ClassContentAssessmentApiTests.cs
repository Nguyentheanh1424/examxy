using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Features.Assessments.DTOs;
using examxy.Application.Features.ClassContent.DTOs;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Application.Features.Notifications.DTOs;
using examxy.Application.Features.PaperExams.DTOs;
using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Domain.Notifications.Enums;
using examxy.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using examxy.Server.Contracts;

namespace test.Integration.Auth
{
    public sealed class ClassContentAssessmentApiTests : IClassFixture<AuthApiFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AuthApiFactory _factory;
        private readonly HttpClient _client;

        public ClassContentAssessmentApiTests(AuthApiFactory factory)
        {
            _factory = factory;
            _factory.EmailSender.Clear();
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task ClassContent_AuthorizationMatrix_EnforcesOwnerAndMembership()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var otherTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var memberStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            var nonMemberStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Matrix Class"
            });

            await EnrollStudentIntoClassAsync(
                ownerTeacher.AccessToken,
                memberStudent,
                classroom.Id,
                memberStudent.Email);

            using var ownerCreatePost = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classroom.Id}/posts",
                ownerTeacher.AccessToken,
                new CreateClassPostRequestDto
                {
                    Title = "Welcome",
                    ContentPlainText = "owner content",
                    ContentRichText = "<p>owner content</p>",
                    NotifyAll = false,
                    TaggedUserIds = Array.Empty<string>()
                });

            var ownerPostResponse = await _client.SendAsync(ownerCreatePost);
            Assert.Equal(HttpStatusCode.OK, ownerPostResponse.StatusCode);

            using var otherTeacherCreatePost = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classroom.Id}/posts",
                otherTeacher.AccessToken,
                new CreateClassPostRequestDto
                {
                    Title = "Unauthorized",
                    ContentPlainText = "not owner",
                    ContentRichText = "<p>not owner</p>"
                });

            var otherTeacherPostResponse = await _client.SendAsync(otherTeacherCreatePost);
            Assert.Equal(HttpStatusCode.NotFound, otherTeacherPostResponse.StatusCode);

            using var memberFeedRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/classes/{classroom.Id}/feed",
                memberStudent.AccessToken);

            var memberFeedResponse = await _client.SendAsync(memberFeedRequest);
            Assert.Equal(HttpStatusCode.OK, memberFeedResponse.StatusCode);

            using var nonMemberFeedRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/classes/{classroom.Id}/feed",
                nonMemberStudent.AccessToken);

            var nonMemberFeedResponse = await _client.SendAsync(nonMemberFeedRequest);
            Assert.Equal(HttpStatusCode.Forbidden, nonMemberFeedResponse.StatusCode);
        }

        [Fact]
        public async Task MentionCandidates_EnforcesAccess_AndReturnsClassParticipants()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var memberStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            var nonMemberStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Mention Candidate Class"
            });

            await EnrollStudentIntoClassAsync(
                ownerTeacher.AccessToken,
                memberStudent,
                classroom.Id,
                memberStudent.Email);

            using (var ownerRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/classes/{classroom.Id}/mention-candidates",
                ownerTeacher.AccessToken))
            {
                var ownerResponse = await _client.SendAsync(ownerRequest);
                Assert.Equal(HttpStatusCode.OK, ownerResponse.StatusCode);

                var ownerPayload = await ownerResponse.Content
                    .ReadFromJsonAsync<IReadOnlyCollection<ClassMentionCandidateDto>>(JsonOptions);

                Assert.NotNull(ownerPayload);
                Assert.Contains(ownerPayload!, candidate => candidate.UserId == memberStudent.UserId);
            }

            using (var studentRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/classes/{classroom.Id}/mention-candidates",
                memberStudent.AccessToken))
            {
                var studentResponse = await _client.SendAsync(studentRequest);
                Assert.Equal(HttpStatusCode.OK, studentResponse.StatusCode);

                var studentPayload = await studentResponse.Content
                    .ReadFromJsonAsync<IReadOnlyCollection<ClassMentionCandidateDto>>(JsonOptions);

                Assert.NotNull(studentPayload);
                Assert.Contains(studentPayload!, candidate => candidate.UserId == ownerTeacher.UserId);
            }

            using (var nonMemberRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/classes/{classroom.Id}/mention-candidates",
                nonMemberStudent.AccessToken))
            {
                var nonMemberResponse = await _client.SendAsync(nonMemberRequest);
                Assert.Equal(HttpStatusCode.Forbidden, nonMemberResponse.StatusCode);
            }
        }

        [Fact]
        public async Task PostReaction_SetUpdateRemove_UsesSingleReactionPerUser()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var student = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Reaction Class"
            });

            await EnrollStudentIntoClassAsync(
                ownerTeacher.AccessToken,
                student,
                classroom.Id,
                student.Email);

            var createdPost = await CreatePostAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassPostRequestDto
                {
                    Title = "Reaction test",
                    ContentPlainText = "body",
                    ContentRichText = "<p>body</p>"
                });

            var likeSummary = await SetPostReactionAsync(
                student.AccessToken,
                classroom.Id,
                createdPost.Id,
                "Like");
            Assert.Equal("Like", likeSummary.ViewerReaction);
            Assert.Equal(1, likeSummary.TotalCount);

            var loveSummary = await SetPostReactionAsync(
                student.AccessToken,
                classroom.Id,
                createdPost.Id,
                "Love");
            Assert.Equal("Love", loveSummary.ViewerReaction);
            Assert.Equal(1, loveSummary.TotalCount);

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var count = await dbContext.ClassPostReactions.CountAsync(
                    reaction => reaction.PostId == createdPost.Id && reaction.UserId == student.UserId);
                Assert.Equal(1, count);
            }

            var removedSummary = await SetPostReactionAsync(
                student.AccessToken,
                classroom.Id,
                createdPost.Id,
                null);

            Assert.Null(removedSummary.ViewerReaction);
            Assert.Equal(0, removedSummary.TotalCount);
        }

        [Fact]
        public async Task MentionNotifications_AreIdempotent_ForTaggedAndNotifyAll()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var studentA = await RegisterStudentAsync(CreateStudentRegisterRequest());
            var studentB = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Notify Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, studentA, classroom.Id, studentA.Email);
            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, studentB, classroom.Id, studentB.Email);

            var post = await CreatePostAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassPostRequestDto
                {
                    Title = "Tagging",
                    ContentPlainText = "Tag body",
                    ContentRichText = "<p>Tag body</p>",
                    NotifyAll = false,
                    TaggedUserIds = new[] { studentA.UserId }
                });

            await UpdatePostAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                post.Id,
                new UpdateClassPostRequestDto
                {
                    Title = "Tagging",
                    ContentPlainText = "Tag body",
                    ContentRichText = "<p>Tag body</p>",
                    Status = "Published",
                    NotifyAll = false,
                    TaggedUserIds = new[] { studentA.UserId }
                });

            await UpdatePostAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                post.Id,
                new UpdateClassPostRequestDto
                {
                    Title = "Tagging",
                    ContentPlainText = "Tag body",
                    ContentRichText = "<p>Tag body</p>",
                    Status = "Published",
                    NotifyAll = true,
                    TaggedUserIds = new[] { studentA.UserId, studentB.UserId }
                });

            await UpdatePostAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                post.Id,
                new UpdateClassPostRequestDto
                {
                    Title = "Tagging",
                    ContentPlainText = "Tag body",
                    ContentRichText = "<p>Tag body</p>",
                    Status = "Published",
                    NotifyAll = true,
                    TaggedUserIds = new[] { studentA.UserId, studentB.UserId }
                });

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var allNotifications = await dbContext.UserNotifications
                .Where(notification => notification.ClassId == classroom.Id)
                .ToArrayAsync();

            Assert.Equal(
                allNotifications.Length,
                allNotifications.Select(notification => notification.NotificationKey).Distinct(StringComparer.Ordinal).Count());

            var notifyAllNotifications = allNotifications
                .Where(notification => notification.NotificationType == NotificationType.MentionedAllInPost)
                .ToArray();

            Assert.Equal(2, notifyAllNotifications.Length);
            Assert.Contains(notifyAllNotifications, notification => notification.RecipientUserId == studentA.UserId);
            Assert.Contains(notifyAllNotifications, notification => notification.RecipientUserId == studentB.UserId);
        }

        [Fact]
        public async Task Notifications_ListAndRead_ExposeCanonicalDashboardLinks()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var student = await RegisterStudentAsync(CreateStudentRegisterRequest());
            var otherStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Notifications Class"
            });
            var otherClassroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Other Notifications Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, classroom.Id, student.Email);
            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, otherStudent, classroom.Id, otherStudent.Email);
            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, otherClassroom.Id, student.Email);

            var post = await CreatePostAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassPostRequestDto
                {
                    Title = "Class update",
                    ContentPlainText = "body",
                    ContentRichText = "<p>body</p>",
                    TaggedUserIds = new[] { student.UserId }
                });

            var question = await CreateQuestionAsync(
                ownerTeacher.AccessToken,
                new CreateQuestionRequestDto
                {
                    QuestionType = "SingleChoice",
                    StemPlainText = "1 + 1 = ?",
                    StemRichText = "<p>1 + 1 = ?</p>",
                    ContentJson = "{\"choices\":[\"1\",\"2\"]}",
                    AnswerKeyJson = "\"2\"",
                    Tags = new[] { "math" }
                });

            var assessment = await CreateAssessmentAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateAssessmentRequestDto
                {
                    Title = "Quiz 1",
                    DescriptionPlainText = "desc",
                    DescriptionRichText = "<p>desc</p>",
                    DurationMinutes = 15,
                    MaxAttempts = 1,
                    ShuffleQuestions = false,
                    ShuffleAnswers = false,
                    Questions = new[]
                    {
                        new AssessmentQuestionInputDto
                        {
                            QuestionId = question.Id,
                            Order = 1,
                            Points = 1
                        }
                    }
                });
            await CreatePostAsync(
                ownerTeacher.AccessToken,
                otherClassroom.Id,
                new CreateClassPostRequestDto
                {
                    Title = "Other class update",
                    ContentPlainText = "other body",
                    ContentRichText = "<p>other body</p>",
                    TaggedUserIds = new[] { student.UserId }
                });

            await PublishAssessmentAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                assessment.Id,
                new PublishAssessmentRequestDto
                {
                    OpenAtUtc = DateTime.UtcNow.AddMinutes(-5),
                    CloseAtUtc = DateTime.UtcNow.AddDays(1)
                });

            using var listRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                "/api/notifications",
                student.AccessToken);

            var listResponse = await _client.SendAsync(listRequest);
            listResponse.EnsureSuccessStatusCode();

            var listPayload = await listResponse.Content.ReadFromJsonAsync<NotificationInboxListDto>(JsonOptions);
            Assert.NotNull(listPayload);
            Assert.Equal(3, listPayload!.UnreadCount);
            Assert.Equal(3, listPayload.Items.Count);

            var postNotification = Assert.Single(listPayload.Items.Where(item =>
                item.ClassId == classroom.Id &&
                item.SourceType == nameof(NotificationSourceType.Post)));
            Assert.Equal($"/classes/{classroom.Id}", postNotification.LinkPath);
            Assert.Equal("feed", postNotification.FeatureArea);
            Assert.True(postNotification.ClassId.HasValue);
            Assert.Equal(classroom.Id, postNotification.ClassId.Value);
            Assert.Equal(post.Id, postNotification.PostId);
            Assert.Null(postNotification.CommentId);
            Assert.Null(postNotification.AssessmentId);

            var assessmentNotification = Assert.Single(listPayload.Items.Where(item =>
                item.ClassId == classroom.Id &&
                item.SourceType == nameof(NotificationSourceType.Assessment)));
            Assert.Equal($"/classes/{classroom.Id}", assessmentNotification.LinkPath);
            Assert.Equal("assessments", assessmentNotification.FeatureArea);
            Assert.True(assessmentNotification.ClassId.HasValue);
            Assert.Equal(classroom.Id, assessmentNotification.ClassId.Value);
            Assert.Equal(assessment.Id, assessmentNotification.AssessmentId);
            Assert.Null(assessmentNotification.PostId);
            Assert.Null(assessmentNotification.CommentId);

            using var filteredRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/notifications?classId={classroom.Id}",
                student.AccessToken);

            var filteredResponse = await _client.SendAsync(filteredRequest);
            filteredResponse.EnsureSuccessStatusCode();

            var filteredPayload = await filteredResponse.Content.ReadFromJsonAsync<NotificationInboxListDto>(JsonOptions);
            Assert.NotNull(filteredPayload);
            Assert.Equal(3, filteredPayload!.UnreadCount);
            Assert.Equal(2, filteredPayload.Items.Count);
            Assert.All(filteredPayload.Items, item =>
            {
                Assert.True(item.ClassId.HasValue);
                Assert.Equal(classroom.Id, item.ClassId.Value);
            });

            var dashboardBeforeRead = await GetClassDashboardAsync(student.AccessToken, classroom.Id);
            Assert.Equal(2, dashboardBeforeRead.UnreadNotificationCount);

            using var markReadRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/notifications/{postNotification.Id}/read",
                student.AccessToken);

            var markReadResponse = await _client.SendAsync(markReadRequest);
            markReadResponse.EnsureSuccessStatusCode();

            var markReadPayload = await markReadResponse.Content.ReadFromJsonAsync<MarkNotificationsReadResultDto>(JsonOptions);
            Assert.NotNull(markReadPayload);
            Assert.Equal(1, markReadPayload!.UpdatedCount);
            Assert.Equal(2, markReadPayload.UnreadCount);

            using var forbiddenReadRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/notifications/{assessmentNotification.Id}/read",
                otherStudent.AccessToken);

            var forbiddenReadResponse = await _client.SendAsync(forbiddenReadRequest);
            Assert.Equal(HttpStatusCode.NotFound, forbiddenReadResponse.StatusCode);

            using var readAllRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/notifications/read-all?classId={classroom.Id}",
                student.AccessToken);

            var readAllResponse = await _client.SendAsync(readAllRequest);
            readAllResponse.EnsureSuccessStatusCode();

            var readAllPayload = await readAllResponse.Content.ReadFromJsonAsync<MarkNotificationsReadResultDto>(JsonOptions);
            Assert.NotNull(readAllPayload);
            Assert.Equal(1, readAllPayload!.UpdatedCount);
            Assert.Equal(1, readAllPayload.UnreadCount);

            var dashboardAfterClassRead = await GetClassDashboardAsync(student.AccessToken, classroom.Id);
            Assert.Equal(0, dashboardAfterClassRead.UnreadNotificationCount);

            using var readAllRemainingRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/notifications/read-all",
                student.AccessToken);

            var readAllRemainingResponse = await _client.SendAsync(readAllRemainingRequest);
            readAllRemainingResponse.EnsureSuccessStatusCode();

            var readAllRemainingPayload = await readAllRemainingResponse.Content.ReadFromJsonAsync<MarkNotificationsReadResultDto>(JsonOptions);
            Assert.NotNull(readAllRemainingPayload);
            Assert.Equal(1, readAllRemainingPayload!.UpdatedCount);
            Assert.Equal(0, readAllRemainingPayload.UnreadCount);
        }

        [Fact]
        public async Task AssessmentRules_EnforcePublishLockAttemptLimit_AndAutoGrade()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var student = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Assessment Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, classroom.Id, student.Email);

            var question = await CreateQuestionAsync(
                ownerTeacher.AccessToken,
                new CreateQuestionRequestDto
                {
                    QuestionType = "SingleChoice",
                    StemPlainText = "2 + 2 = ?",
                    StemRichText = "<p>2 + 2 = ?</p>",
                    ContentJson = "{\"choices\":[\"3\",\"4\"]}",
                    AnswerKeyJson = "\"4\"",
                    Tags = new[] { "math" }
                });

            var assessment = await CreateAssessmentAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateAssessmentRequestDto
                {
                    Title = "Quick test",
                    DescriptionPlainText = "simple",
                    AssessmentKind = "Practice",
                    AttemptLimit = 1,
                    Items = new[]
                    {
                        new CreateAssessmentItemRequestDto
                        {
                            DisplayOrder = 1,
                            SourceQuestionId = question.Id,
                            Points = 1
                        }
                    }
                });

            var published = await PublishAssessmentAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                assessment.Id,
                new PublishAssessmentRequestDto());

            Assert.Equal("Published", published.Status);

            using (var lockedUpdateRequest = CreateAuthenticatedRequest(
                HttpMethod.Put,
                $"/api/classes/{classroom.Id}/assessments/{assessment.Id}",
                ownerTeacher.AccessToken,
                new UpdateAssessmentRequestDto
                {
                    Title = "Changed title",
                    DescriptionPlainText = "locked",
                    AssessmentKind = "Practice",
                    AttemptLimit = 1,
                    Items = new[] { new CreateAssessmentItemRequestDto { DisplayOrder = 1, SourceQuestionId = question.Id, Points = 1 } }
                }))
            {
                var lockedUpdateResponse = await _client.SendAsync(lockedUpdateRequest);
                Assert.Equal(HttpStatusCode.Conflict, lockedUpdateResponse.StatusCode);
            }

            var attempt = await StartAttemptAsync(student.AccessToken, classroom.Id, assessment.Id);
            var savedAttempt = await SaveAnswersAsync(
                student.AccessToken,
                classroom.Id,
                attempt.Id,
                new SaveAttemptAnswersRequestDto
                {
                    Items = new[]
                    {
                        new SaveAnswerItemRequestDto
                        {
                            AssessmentItemId = published.Items.Single().Id,
                            QuestionType = "SingleChoice",
                            AnswerJson = "\"4\""
                        }
                    }
                });

            Assert.Equal("InProgress", savedAttempt.Status);

            var submittedAttempt = await SubmitAttemptAsync(student.AccessToken, classroom.Id, attempt.Id);
            Assert.Equal("AutoGraded", submittedAttempt.Status);
            Assert.Equal(submittedAttempt.MaxScore, submittedAttempt.EarnedScore);

            using var secondAttemptRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classroom.Id}/assessments/{assessment.Id}/attempts",
                student.AccessToken);

            var secondAttemptResponse = await _client.SendAsync(secondAttemptRequest);
            Assert.Equal(HttpStatusCode.Conflict, secondAttemptResponse.StatusCode);
        }

        [Fact]
        public async Task OfflinePaperExamFlow_CreatesBinding_DeliversConfig_AndGradesSubmission()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var studentRegister = CreateStudentRegisterRequest();
            var student = await RegisterStudentAsync(studentRegister);
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Offline Paper Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, classroom.Id, student.Email);

            var question = await CreateQuestionAsync(
                ownerTeacher.AccessToken,
                new CreateQuestionRequestDto
                {
                    QuestionType = "SingleChoice",
                    StemPlainText = "Capital of France?",
                    StemRichText = "<p>Capital of France?</p>",
                    ContentJson = "{\"choices\":[\"Paris\",\"Rome\"]}",
                    AnswerKeyJson = "\"Paris\"",
                    Tags = new[] { "geo" }
                });

            var assessment = await CreateAssessmentAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateAssessmentRequestDto
                {
                    Title = "Paper exam",
                    DescriptionPlainText = "offline",
                    AssessmentKind = "Practice",
                    AttemptLimit = 1,
                    Items = new[]
                    {
                        new CreateAssessmentItemRequestDto
                        {
                            DisplayOrder = 1,
                            SourceQuestionId = question.Id,
                            Points = 1
                        }
                    }
                });

            var published = await PublishAssessmentAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                assessment.Id,
                new PublishAssessmentRequestDto());

            var template = await CreatePaperTemplateAsync(
                ownerTeacher.AccessToken,
                new CreatePaperExamTemplateRequestDto
                {
                    Code = $"TEMPLATE-{Guid.NewGuid():N}",
                    Name = "Sample paper template",
                    Description = "OMR sheet",
                    PaperSize = "A4",
                    OutputWidth = 2480,
                    OutputHeight = 3508,
                    MarkerScheme = "custom",
                    HasStudentIdField = true,
                    HasQuizIdField = true
                });

            var version = await CreatePaperTemplateVersionAsync(
                ownerTeacher.AccessToken,
                template.Id,
                new CreatePaperExamTemplateVersionRequestDto
                {
                    SchemaVersion = "1.0",
                    QuestionCount = 1,
                    OptionsPerQuestion = 2,
                    AbsThreshold = 0.2m,
                    RelThreshold = 0.05m,
                    ScoringMethod = "annulus_patch_darkness",
                    ScoringParamsJson = "{\"method\":\"annulus_patch_darkness\"}",
                    PayloadSchemaVersion = "1.0"
                });

            await UploadPaperTemplateAssetAsync(
                ownerTeacher.AccessToken,
                template.Id,
                version.Id,
                new UploadPaperExamTemplateAssetRequestDto
                {
                    AssetType = "TemplateImage",
                    Base64Content = Convert.ToBase64String(Encoding.UTF8.GetBytes("fake-image")),
                    FileName = "template.png",
                    ContentType = "image/png",
                    IsRequired = true
                });

            await UploadPaperTemplateAssetAsync(
                ownerTeacher.AccessToken,
                template.Id,
                version.Id,
                new UploadPaperExamTemplateAssetRequestDto
                {
                    AssetType = "MarkerLayout",
                    JsonContent = "{\"1\":[0,0],\"2\":[10,10]}",
                    FileName = "marker-layout.json",
                    IsRequired = true
                });

            await UploadPaperTemplateAssetAsync(
                ownerTeacher.AccessToken,
                template.Id,
                version.Id,
                new UploadPaperExamTemplateAssetRequestDto
                {
                    AssetType = "CircleRois",
                    JsonContent = "[{\"cx\":10,\"cy\":20,\"r\":5,\"question\":1,\"option\":0}]",
                    FileName = "circle-rois.json",
                    IsRequired = true
                });

            await UpsertPaperTemplateMetadataFieldsAsync(
                ownerTeacher.AccessToken,
                template.Id,
                version.Id,
                new[]
                {
                    new UpsertPaperExamMetadataFieldRequestDto
                    {
                        FieldCode = "student_id",
                        Label = "Student ID",
                        IsRequired = true,
                        GeometryJson = "{\"origin\":[0,0]}",
                        ValidationPolicyJson = "{}"
                    },
                    new UpsertPaperExamMetadataFieldRequestDto
                    {
                        FieldCode = "quiz_id",
                        Label = "Quiz ID",
                        IsRequired = false,
                        GeometryJson = "{\"origin\":[10,10]}",
                        ValidationPolicyJson = "{}"
                    }
                });

            var validation = await ValidatePaperTemplateVersionAsync(ownerTeacher.AccessToken, template.Id, version.Id);
            Assert.True(validation.IsValid);

            var publishedVersion = await PublishPaperTemplateVersionAsync(ownerTeacher.AccessToken, template.Id, version.Id);
            Assert.Equal("Published", publishedVersion.Status);

            var binding = await UpsertAssessmentPaperBindingAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                assessment.Id,
                new UpsertAssessmentPaperBindingRequestDto
                {
                    TemplateVersionId = publishedVersion.Id,
                    Activate = true,
                    SubmissionPolicyJson = "{\"allowResubmit\":false}",
                    ReviewPolicyJson = "{\"minConfidence\":0.5}",
                    MetadataPolicyJson = "{\"requireStudentId\":true}",
                    AnswerMap = new[]
                    {
                        new AssessmentPaperBindingMapItemDto
                        {
                            QuestionNumber = 1,
                            AssessmentItemId = published.Items.Single().Id
                        }
                    }
                });

            Assert.Equal("Active", binding.Status);

            var config = await GetOfflineScanConfigAsync(student.AccessToken, classroom.Id, assessment.Id);
            Assert.Equal(binding.Id, config.BindingId);
            Assert.Equal(binding.ConfigHash, config.ConfigHash);

            var submission = await SubmitOfflineScanAsync(
                student.AccessToken,
                classroom.Id,
                assessment.Id,
                new OfflineAssessmentScanFormRequest
                {
                    RawImage = null!,
                    BindingId = binding.Id,
                    BindingVersionUsed = binding.BindingVersion,
                    ConfigHashUsed = binding.ConfigHash,
                    ClientSchemaVersion = config.SchemaVersion,
                    ClientAppVersion = "1.0.0",
                    AnswersJson = "[{\"questionNumber\":1,\"detectedOption\":\"Paris\",\"detectedAnswerJson\":\"\\\"Paris\\\"\",\"confidenceJson\":\"{\\\"score\\\":0.91}\"}]",
                    MetadataJson = $"{{\"student_id\":\"{studentRegister.StudentCode}\",\"quiz_id\":\"Q-1\"}}",
                    ConfidenceSummaryJson = "{\"score\":0.91}",
                    WarningFlagsJson = "[]",
                    ConflictFlagsJson = "[]",
                    RawScanPayloadJson = "{\"source\":\"integration-test\"}"
                });

            Assert.Equal("AutoGraded", submission.Status);
            Assert.NotNull(submission.Result);
            Assert.Equal(1, submission.Result!.Score);
            Assert.Contains(submission.Artifacts, artifact => artifact.ArtifactType == "raw_image");
            Assert.Contains(submission.Artifacts, artifact => artifact.ArtifactType == "bubble_overlay");

            var finalized = await FinalizeOfflineScanAsync(ownerTeacher.AccessToken, classroom.Id, assessment.Id, submission.Id);
            Assert.Equal("Finalized", finalized.Status);
        }

        private async Task<AuthResponseDto> RegisterTeacherAsync(RegisterRequestDto request)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/register", request);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<AuthResponseDto> RegisterStudentAsync(StudentRegisterRequestDto request)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/register/student", request);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<TeacherClassSummaryDto> CreateClassAsync(
            AuthResponseDto teacherAuth,
            CreateTeacherClassRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/classes",
                teacherAuth.AccessToken,
                request);

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<TeacherClassSummaryDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task EnrollStudentIntoClassAsync(
            string teacherAccessToken,
            AuthResponseDto studentAuth,
            Guid classId,
            string studentEmail)
        {
            _factory.EmailSender.Clear();

            using (var importRequest = new HttpRequestMessage(HttpMethod.Post, $"/api/classes/{classId}/roster-imports"))
            {
                importRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", teacherAccessToken);
                var csv = $"fullName,studentCode,email{Environment.NewLine}Student Test,STD-{Guid.NewGuid():N},{studentEmail}{Environment.NewLine}";
                var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes(csv));
                fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

                var multipart = new MultipartFormDataContent();
                multipart.Add(fileContent, "file", "roster.csv");
                importRequest.Content = multipart;

                var importResponse = await _client.SendAsync(importRequest);
                importResponse.EnsureSuccessStatusCode();
            }

            var email = Assert.Single(_factory.EmailSender.GetMessages());
            var inviteCode = ExtractInviteCode(email.TextBody);

            using var claimRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/student/invites/claim",
                studentAuth.AccessToken,
                new ClaimClassInviteRequestDto { InviteCode = inviteCode });

            var claimResponse = await _client.SendAsync(claimRequest);
            claimResponse.EnsureSuccessStatusCode();
        }

        private async Task<ClassPostDto> CreatePostAsync(
            string accessToken,
            Guid classId,
            CreateClassPostRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classId}/posts",
                accessToken,
                request);

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<ClassPostDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<ClassPostDto> UpdatePostAsync(
            string accessToken,
            Guid classId,
            Guid postId,
            UpdateClassPostRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Put,
                $"/api/classes/{classId}/posts/{postId}",
                accessToken,
                request);

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<ClassPostDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<ClassReactionSummaryDto> SetPostReactionAsync(
            string accessToken,
            Guid classId,
            Guid postId,
            string? reactionType)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Put,
                $"/api/classes/{classId}/posts/{postId}/reaction",
                accessToken,
                new SetReactionRequestDto { ReactionType = reactionType });

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<ClassReactionSummaryDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<QuestionDto> CreateQuestionAsync(string accessToken, CreateQuestionRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(HttpMethod.Post, "/api/question-bank/questions", accessToken, request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<QuestionDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<ClassDashboardDto> GetClassDashboardAsync(string accessToken, Guid classId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/classes/{classId}/dashboard",
                accessToken);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<ClassDashboardDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<AssessmentDto> CreateAssessmentAsync(
            string accessToken,
            Guid classId,
            CreateAssessmentRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classId}/assessments",
                accessToken,
                request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AssessmentDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<AssessmentDto> PublishAssessmentAsync(
            string accessToken,
            Guid classId,
            Guid assessmentId,
            PublishAssessmentRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classId}/assessments/{assessmentId}/publish",
                accessToken,
                request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AssessmentDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<StudentAssessmentAttemptDto> StartAttemptAsync(
            string accessToken,
            Guid classId,
            Guid assessmentId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classId}/assessments/{assessmentId}/attempts",
                accessToken);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<StudentAssessmentAttemptDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<StudentAssessmentAttemptDto> SaveAnswersAsync(
            string accessToken,
            Guid classId,
            Guid attemptId,
            SaveAttemptAnswersRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Put,
                $"/api/classes/{classId}/assessments/attempts/{attemptId}/answers",
                accessToken,
                request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<StudentAssessmentAttemptDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<StudentAssessmentAttemptDto> SubmitAttemptAsync(
            string accessToken,
            Guid classId,
            Guid attemptId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classId}/assessments/attempts/{attemptId}/submit",
                accessToken);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<StudentAssessmentAttemptDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private static RegisterRequestDto CreateTeacherRegisterRequest()
        {
            var suffix = Guid.NewGuid().ToString("N");
            return new RegisterRequestDto
            {
                FullName = "Teacher User",
                UserName = $"teacher_{suffix}",
                Email = $"{suffix}@teacher.example.test",
                Password = "Pass123",
                ConfirmPassword = "Pass123"
            };
        }

        private static StudentRegisterRequestDto CreateStudentRegisterRequest()
        {
            var suffix = Guid.NewGuid().ToString("N");
            return new StudentRegisterRequestDto
            {
                FullName = "Student User",
                UserName = $"student_{suffix}",
                Email = $"{suffix}@student.example.test",
                StudentCode = $"ST-{suffix[..6].ToUpperInvariant()}",
                Password = "Pass123",
                ConfirmPassword = "Pass123"
            };
        }

        private async Task<PaperExamTemplateDto> CreatePaperTemplateAsync(string accessToken, CreatePaperExamTemplateRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(HttpMethod.Post, "/api/paper-exam/templates", accessToken, request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<PaperExamTemplateDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<PaperExamTemplateVersionDto> CreatePaperTemplateVersionAsync(
            string accessToken,
            Guid templateId,
            CreatePaperExamTemplateVersionRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/paper-exam/templates/{templateId}/versions",
                accessToken,
                request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<PaperExamTemplateVersionDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<PaperExamTemplateAssetDto> UploadPaperTemplateAssetAsync(
            string accessToken,
            Guid templateId,
            Guid versionId,
            UploadPaperExamTemplateAssetRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/paper-exam/templates/{templateId}/versions/{versionId}/assets",
                accessToken,
                request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<PaperExamTemplateAssetDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<IReadOnlyCollection<PaperExamMetadataFieldDto>> UpsertPaperTemplateMetadataFieldsAsync(
            string accessToken,
            Guid templateId,
            Guid versionId,
            IReadOnlyCollection<UpsertPaperExamMetadataFieldRequestDto> request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Put,
                $"/api/paper-exam/templates/{templateId}/versions/{versionId}/metadata-fields",
                accessToken,
                request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<IReadOnlyCollection<PaperExamMetadataFieldDto>>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<ValidatePaperExamTemplateVersionResultDto> ValidatePaperTemplateVersionAsync(string accessToken, Guid templateId, Guid versionId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/paper-exam/templates/{templateId}/versions/{versionId}/validate",
                accessToken);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<ValidatePaperExamTemplateVersionResultDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<PaperExamTemplateVersionDto> PublishPaperTemplateVersionAsync(string accessToken, Guid templateId, Guid versionId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/paper-exam/templates/{templateId}/versions/{versionId}/publish",
                accessToken);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<PaperExamTemplateVersionDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<AssessmentPaperBindingDto> UpsertAssessmentPaperBindingAsync(
            string accessToken,
            Guid classId,
            Guid assessmentId,
            UpsertAssessmentPaperBindingRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classId}/assessments/{assessmentId}/paper-binding",
                accessToken,
                request);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AssessmentPaperBindingDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<StudentOfflineScanConfigDto> GetOfflineScanConfigAsync(string accessToken, Guid classId, Guid assessmentId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/classes/{classId}/assessments/{assessmentId}/offline-scan-config",
                accessToken);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<StudentOfflineScanConfigDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<AssessmentScanSubmissionDto> SubmitOfflineScanAsync(
            string accessToken,
            Guid classId,
            Guid assessmentId,
            OfflineAssessmentScanFormRequest request)
        {
            using var message = new HttpRequestMessage(
                HttpMethod.Post,
                $"/api/classes/{classId}/assessments/{assessmentId}/offline-submissions");
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var multipart = new MultipartFormDataContent();
            var imageContent = new ByteArrayContent(Encoding.UTF8.GetBytes("raw-image"));
            imageContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            multipart.Add(imageContent, nameof(request.RawImage), "raw.png");
            multipart.Add(new StringContent(request.BindingId.ToString()), nameof(request.BindingId));
            multipart.Add(new StringContent(request.BindingVersionUsed.ToString()), nameof(request.BindingVersionUsed));
            multipart.Add(new StringContent(request.ConfigHashUsed), nameof(request.ConfigHashUsed));
            multipart.Add(new StringContent(request.ClientSchemaVersion), nameof(request.ClientSchemaVersion));
            multipart.Add(new StringContent(request.ClientAppVersion ?? string.Empty), nameof(request.ClientAppVersion));
            multipart.Add(new StringContent(request.AnswersJson), nameof(request.AnswersJson));
            multipart.Add(new StringContent(request.MetadataJson), nameof(request.MetadataJson));
            multipart.Add(new StringContent(request.ConfidenceSummaryJson), nameof(request.ConfidenceSummaryJson));
            multipart.Add(new StringContent(request.WarningFlagsJson), nameof(request.WarningFlagsJson));
            multipart.Add(new StringContent(request.ConflictFlagsJson), nameof(request.ConflictFlagsJson));
            multipart.Add(new StringContent(request.RawScanPayloadJson), nameof(request.RawScanPayloadJson));
            message.Content = multipart;

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AssessmentScanSubmissionDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<AssessmentScanSubmissionDto> FinalizeOfflineScanAsync(string accessToken, Guid classId, Guid assessmentId, Guid submissionId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classId}/assessments/{assessmentId}/offline-submissions/{submissionId}/finalize",
                accessToken);
            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AssessmentScanSubmissionDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private static string ExtractInviteCode(string? textBody)
        {
            Assert.False(string.IsNullOrWhiteSpace(textBody));
            var match = Regex.Match(textBody!, @"invite code ([A-Z0-9]+)", RegexOptions.IgnoreCase);
            Assert.True(match.Success);
            return match.Groups[1].Value.ToUpperInvariant();
        }

        private static HttpRequestMessage CreateAuthenticatedRequest(
            HttpMethod method,
            string uri,
            string accessToken,
            object? body = null)
        {
            var request = new HttpRequestMessage(method, uri);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            if (body is not null)
            {
                request.Content = JsonContent.Create(body);
            }

            return request;
        }
    }
}
