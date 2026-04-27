using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Features.Assessments.DTOs;
using examxy.Application.Features.ClassContent.DTOs;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Application.Features.Notifications;
using examxy.Application.Features.Notifications.DTOs;
using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Domain.Classrooms;
using examxy.Domain.Notifications.Enums;
using examxy.Infrastructure.Features.Notifications;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace test.Integration.Auth
{
    public sealed class NotificationReminderApiTests : IClassFixture<AuthApiFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AuthApiFactory _factory;
        private readonly HttpClient _client;

        public NotificationReminderApiTests(AuthApiFactory factory)
        {
            _factory = factory;
            _factory.EmailSender.Clear();
            ResetReminderStateAsync().GetAwaiter().GetResult();
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        private async Task ResetReminderStateAsync()
        {
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            dbContext.UserNotifications.RemoveRange(dbContext.UserNotifications);
            dbContext.ClassScheduleItems.RemoveRange(dbContext.ClassScheduleItems);
            await dbContext.SaveChangesAsync();

            var options = scope.ServiceProvider.GetRequiredService<IOptions<NotificationReminderOptions>>().Value;
            options.EmailEnabled = false;
        }

        [Fact]
        public async Task ReminderProcessor_CreatesAssessmentAndDeadlineReminders_AndExposesScheduleTargets()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var activeStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            var inactiveStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            var nonMemberStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Reminder Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, activeStudent, classroom.Id, activeStudent.Email);
            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, inactiveStudent, classroom.Id, inactiveStudent.Email);
            await SetMembershipStatusAsync(classroom.Id, inactiveStudent.UserId, ClassMembershipStatus.Removed);

            var question = await CreateQuestionAsync(
                ownerTeacher.AccessToken,
                new CreateQuestionRequestDto
                {
                    QuestionType = "SingleChoice",
                    StemPlainText = "2 + 3 = ?",
                    StemRichText = "<p>2 + 3 = ?</p>",
                    ContentJson = "{\"choices\":[\"4\",\"5\"]}",
                    AnswerKeyJson = "\"5\"",
                    Tags = new[] { "math" }
                });

            var assessment = await CreateAssessmentAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateAssessmentRequestDto
                {
                    Title = "Upcoming quiz",
                    DescriptionPlainText = "desc",
                    DescriptionRichText = "<p>desc</p>",
                    AssessmentKind = "Practice",
                    AttemptLimit = 1,
                    TimeLimitMinutes = 15,
                    QuestionOrderMode = "Fixed",
                    Items = new[]
                    {
                        new CreateAssessmentItemRequestDto
                        {
                            SourceQuestionId = question.Id,
                            DisplayOrder = 1,
                            Points = 1
                        }
                    }
                });

            var assessmentSchedule = await CreateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassScheduleItemRequestDto
                {
                    Type = "Assessment",
                    Title = "Assessment reminder",
                    DescriptionPlainText = "assessment",
                    DescriptionRichText = "<p>assessment</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(55),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false,
                    RelatedAssessmentId = assessment.Id
                });

            var deadlineSchedule = await CreateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassScheduleItemRequestDto
                {
                    Type = "Deadline",
                    Title = "Deadline reminder",
                    DescriptionPlainText = "deadline",
                    DescriptionRichText = "<p>deadline</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(58),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            await CreateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassScheduleItemRequestDto
                {
                    Type = "Event",
                    Title = "Event not reminded",
                    DescriptionPlainText = "event",
                    DescriptionRichText = "<p>event</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(57),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            await CreateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassScheduleItemRequestDto
                {
                    Type = "Reminder",
                    Title = "Reminder type ignored",
                    DescriptionPlainText = "reminder",
                    DescriptionRichText = "<p>reminder</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(56),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            NotificationReminderProcessingResult firstRun;
            NotificationReminderProcessingResult secondRun;

            using (var scope = _factory.Services.CreateScope())
            {
                var processor = scope.ServiceProvider.GetRequiredService<INotificationReminderProcessor>();
                firstRun = await processor.ProcessDueRemindersAsync();
                secondRun = await processor.ProcessDueRemindersAsync();
            }

            Assert.Equal(2, firstRun.ItemsScanned);
            Assert.Equal(2, firstRun.RecipientsEvaluated);
            Assert.Equal(2, firstRun.CreatedCount);
            Assert.Equal(0, firstRun.SkippedExistingCount);
            Assert.Equal(2, secondRun.ItemsScanned);
            Assert.Equal(0, secondRun.CreatedCount);
            Assert.Equal(2, secondRun.SkippedExistingCount);

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var notifications = await dbContext.UserNotifications
                    .Where(notification => notification.ClassId == classroom.Id)
                    .OrderBy(notification => notification.CreatedAtUtc)
                    .ToArrayAsync();

                Assert.Equal(2, notifications.Length);
                Assert.All(notifications, notification =>
                {
                    Assert.Equal(NotificationType.ScheduleItemReminder24Hours, notification.NotificationType);
                    Assert.Equal(NotificationSourceType.ScheduleItem, notification.SourceType);
                    Assert.Equal(activeStudent.UserId, notification.RecipientUserId);
                });
                Assert.Equal(
                    notifications.Length,
                    notifications.Select(notification => notification.NotificationKey).Distinct(StringComparer.Ordinal).Count());
                Assert.DoesNotContain(notifications, notification => notification.RecipientUserId == inactiveStudent.UserId);
                Assert.DoesNotContain(notifications, notification => notification.RecipientUserId == nonMemberStudent.UserId);
            }

            using var listRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                "/api/notifications?sourceType=ScheduleItem",
                activeStudent.AccessToken);

            var listResponse = await _client.SendAsync(listRequest);
            listResponse.EnsureSuccessStatusCode();

            var listPayload = await listResponse.Content.ReadFromJsonAsync<NotificationInboxListDto>(JsonOptions);
            Assert.NotNull(listPayload);
            Assert.Equal(2, listPayload!.UnreadCount);
            Assert.Equal(2, listPayload.Items.Count);

            var assessmentReminder = Assert.Single(
                listPayload.Items,
                item => item.ScheduleItemId == assessmentSchedule.Id);
            Assert.Equal(nameof(NotificationSourceType.ScheduleItem), assessmentReminder.SourceType);
            Assert.Equal("schedule", assessmentReminder.FeatureArea);
            Assert.Equal($"/classes/{classroom.Id}", assessmentReminder.LinkPath);
            Assert.Equal(assessment.Id, assessmentReminder.AssessmentId);
            Assert.Null(assessmentReminder.PostId);
            Assert.Null(assessmentReminder.CommentId);

            var deadlineReminder = Assert.Single(
                listPayload.Items,
                item => item.ScheduleItemId == deadlineSchedule.Id);
            Assert.Equal("schedule", deadlineReminder.FeatureArea);
            Assert.Null(deadlineReminder.AssessmentId);

            var dashboard = await GetClassDashboardAsync(activeStudent.AccessToken, classroom.Id);
            Assert.Equal(2, dashboard.UnreadNotificationCount);
        }

        [Fact]
        public async Task ReminderProcessor_UsesLatestScheduleTime_WhenItemIsRescheduledBeforeDispatch()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var student = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Reschedule Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, classroom.Id, student.Email);

            var schedule = await CreateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassScheduleItemRequestDto
                {
                    Type = "Deadline",
                    Title = "Moving deadline",
                    DescriptionPlainText = "deadline",
                    DescriptionRichText = "<p>deadline</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(55),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            await UpdateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                schedule.Id,
                new UpdateClassScheduleItemRequestDto
                {
                    Type = "Deadline",
                    Title = "Moving deadline",
                    DescriptionPlainText = "deadline",
                    DescriptionRichText = "<p>deadline</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(30),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            NotificationReminderProcessingResult result;

            using (var scope = _factory.Services.CreateScope())
            {
                var processor = scope.ServiceProvider.GetRequiredService<INotificationReminderProcessor>();
                result = await processor.ProcessDueRemindersAsync();
            }

            Assert.Equal(0, result.CreatedCount);

            using var verificationScope = _factory.Services.CreateScope();
            var dbContext = verificationScope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Empty(await dbContext.UserNotifications.ToArrayAsync());
        }

        [Fact]
        public async Task ReminderProcessor_SendsEmail_WhenReminderEmailDeliveryIsEnabled()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var student = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Email Reminder Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, classroom.Id, student.Email);
            _factory.EmailSender.Clear();
            SetReminderEmailEnabled(true);

            try
            {
                await CreateScheduleItemAsync(
                    ownerTeacher.AccessToken,
                    classroom.Id,
                    new CreateClassScheduleItemRequestDto
                    {
                        Type = "Deadline",
                        Title = "Email reminder deadline",
                        DescriptionPlainText = "deadline",
                        DescriptionRichText = "<p>deadline</p>",
                        StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(55),
                        EndAtUtc = null,
                        TimezoneId = "UTC",
                        IsAllDay = false
                    });

                NotificationReminderProcessingResult firstRun;
                NotificationReminderProcessingResult secondRun;

                using (var scope = _factory.Services.CreateScope())
                {
                    var processor = scope.ServiceProvider.GetRequiredService<INotificationReminderProcessor>();
                    firstRun = await processor.ProcessDueRemindersAsync();
                    secondRun = await processor.ProcessDueRemindersAsync();
                }

                Assert.Equal(1, firstRun.CreatedCount);
                Assert.Equal(0, secondRun.CreatedCount);
                Assert.Equal(1, secondRun.SkippedExistingCount);

                var sentEmail = Assert.Single(_factory.EmailSender.GetMessages());
                Assert.Equal(student.Email, sentEmail.To);
                Assert.Equal("Examxy: Upcoming deadline reminder", sentEmail.Subject);
                Assert.Contains("Email reminder deadline", sentEmail.TextBody);
                Assert.Contains("A class deadline is scheduled in 24 hours.", sentEmail.TextBody);
                Assert.Contains($"https://client.examxy.test/classes/{classroom.Id}", sentEmail.TextBody);
                Assert.Contains("Open class schedule", sentEmail.TextBody);
            }
            finally
            {
                SetReminderEmailEnabled(false);
            }
        }

        [Fact]
        public async Task ReminderProcessor_DoesNotSendEmail_WhenReminderEmailDeliveryIsDisabled()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var student = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();
            SetReminderEmailEnabled(false);

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Disabled Email Reminder Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, classroom.Id, student.Email);
            _factory.EmailSender.Clear();

            await CreateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassScheduleItemRequestDto
                {
                    Type = "Deadline",
                    Title = "No email reminder deadline",
                    DescriptionPlainText = "deadline",
                    DescriptionRichText = "<p>deadline</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(55),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            NotificationReminderProcessingResult result;

            using (var scope = _factory.Services.CreateScope())
            {
                var processor = scope.ServiceProvider.GetRequiredService<INotificationReminderProcessor>();
                result = await processor.ProcessDueRemindersAsync();
            }

            Assert.Equal(1, result.CreatedCount);
            Assert.Empty(_factory.EmailSender.GetMessages());
        }

        [Fact]
        public async Task UpdateScheduleItem_RevokesUnreadStaleReminderNotifications()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var student = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Unread Stale Reminder Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, classroom.Id, student.Email);

            var schedule = await CreateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassScheduleItemRequestDto
                {
                    Type = "Deadline",
                    Title = "Unread stale reminder",
                    DescriptionPlainText = "deadline",
                    DescriptionRichText = "<p>deadline</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(55),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            using (var scope = _factory.Services.CreateScope())
            {
                var processor = scope.ServiceProvider.GetRequiredService<INotificationReminderProcessor>();
                var result = await processor.ProcessDueRemindersAsync();
                Assert.Equal(1, result.CreatedCount);
            }

            await UpdateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                schedule.Id,
                new UpdateClassScheduleItemRequestDto
                {
                    Type = "Deadline",
                    Title = "Unread stale reminder",
                    DescriptionPlainText = "deadline",
                    DescriptionRichText = "<p>deadline</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(30),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var notifications = await dbContext.UserNotifications
                    .Where(notification => notification.SourceId == schedule.Id)
                    .ToArrayAsync();

                Assert.Empty(notifications);
            }

            using var listRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/notifications?sourceType=ScheduleItem&classId={classroom.Id}",
                student.AccessToken);

            var listResponse = await _client.SendAsync(listRequest);
            listResponse.EnsureSuccessStatusCode();
            var listPayload = await listResponse.Content.ReadFromJsonAsync<NotificationInboxListDto>(JsonOptions);
            Assert.NotNull(listPayload);
            Assert.Equal(0, listPayload!.UnreadCount);
            Assert.Empty(listPayload.Items);

            var dashboard = await GetClassDashboardAsync(student.AccessToken, classroom.Id);
            Assert.Equal(0, dashboard.UnreadNotificationCount);
        }

        [Fact]
        public async Task UpdateScheduleItem_KeepsReadStaleReminderNotifications()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var student = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Read Stale Reminder Class"
            });

            await EnrollStudentIntoClassAsync(ownerTeacher.AccessToken, student, classroom.Id, student.Email);

            var schedule = await CreateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new CreateClassScheduleItemRequestDto
                {
                    Type = "Deadline",
                    Title = "Read stale reminder",
                    DescriptionPlainText = "deadline",
                    DescriptionRichText = "<p>deadline</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(23).AddMinutes(55),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            Guid notificationId;
            using (var scope = _factory.Services.CreateScope())
            {
                var processor = scope.ServiceProvider.GetRequiredService<INotificationReminderProcessor>();
                var result = await processor.ProcessDueRemindersAsync();
                Assert.Equal(1, result.CreatedCount);

                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var notification = await dbContext.UserNotifications
                    .SingleAsync(candidate => candidate.SourceId == schedule.Id);
                notificationId = notification.Id;
            }

            await MarkNotificationAsReadAsync(student.AccessToken, notificationId);

            await UpdateScheduleItemAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                schedule.Id,
                new UpdateClassScheduleItemRequestDto
                {
                    Type = "Deadline",
                    Title = "Read stale reminder",
                    DescriptionPlainText = "deadline",
                    DescriptionRichText = "<p>deadline</p>",
                    StartAtUtc = DateTime.UtcNow.AddHours(30),
                    EndAtUtc = null,
                    TimezoneId = "UTC",
                    IsAllDay = false
                });

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var notification = await dbContext.UserNotifications
                    .SingleAsync(candidate => candidate.Id == notificationId);

                Assert.True(notification.IsRead);
                Assert.NotNull(notification.ReadAtUtc);
            }
        }

        private async Task<AuthResponseDto> RegisterTeacherAsync(RegisterRequestDto request)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/register", request);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task MarkNotificationAsReadAsync(
            string accessToken,
            Guid notificationId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/notifications/{notificationId}/read",
                accessToken);

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
        }

        private void SetReminderEmailEnabled(bool enabled)
        {
            using var scope = _factory.Services.CreateScope();
            var options = scope.ServiceProvider.GetRequiredService<IOptions<NotificationReminderOptions>>().Value;
            options.EmailEnabled = enabled;
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

        private async Task SetMembershipStatusAsync(
            Guid classId,
            string userId,
            ClassMembershipStatus status)
        {
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var membership = await dbContext.ClassMemberships
                .FirstAsync(candidate => candidate.ClassId == classId && candidate.StudentUserId == userId);
            membership.Status = status;
            await dbContext.SaveChangesAsync();
        }

        private async Task<QuestionDto> CreateQuestionAsync(
            string accessToken,
            CreateQuestionRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/question-bank/questions",
                accessToken,
                request);

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

        private async Task<ClassScheduleItemDto> CreateScheduleItemAsync(
            string accessToken,
            Guid classId,
            CreateClassScheduleItemRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classId}/schedule-items",
                accessToken,
                request);

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<ClassScheduleItemDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<ClassScheduleItemDto> UpdateScheduleItemAsync(
            string accessToken,
            Guid classId,
            Guid scheduleItemId,
            UpdateClassScheduleItemRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Put,
                $"/api/classes/{classId}/schedule-items/{scheduleItemId}",
                accessToken,
                request);

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<ClassScheduleItemDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<ClassDashboardDto> GetClassDashboardAsync(
            string accessToken,
            Guid classId)
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
