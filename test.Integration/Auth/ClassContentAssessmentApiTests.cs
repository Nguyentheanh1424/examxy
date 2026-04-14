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
using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Domain.ClassContent;
using examxy.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

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

            var allNotifications = await dbContext.ClassNotifications
                .Where(notification => notification.ClassId == classroom.Id)
                .ToArrayAsync();

            Assert.Equal(
                allNotifications.Length,
                allNotifications.Select(notification => notification.NotificationKey).Distinct(StringComparer.Ordinal).Count());

            var notifyAllNotifications = allNotifications
                .Where(notification => notification.NotificationType == ClassNotificationType.MentionedAllInPost)
                .ToArray();

            Assert.Equal(2, notifyAllNotifications.Length);
            Assert.Contains(notifyAllNotifications, notification => notification.RecipientUserId == studentA.UserId);
            Assert.Contains(notifyAllNotifications, notification => notification.RecipientUserId == studentB.UserId);
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
