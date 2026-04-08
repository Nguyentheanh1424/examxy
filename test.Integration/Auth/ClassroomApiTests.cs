using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Text.Json;
using examxy.Application.Abstractions.Classrooms.DTOs;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Infrastructure.Academic;
using examxy.Infrastructure.Identity;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;

namespace test.Integration.Auth
{
    public sealed class ClassroomApiTests : IClassFixture<AuthApiFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AuthApiFactory _factory;
        private readonly HttpClient _client;

        public ClassroomApiTests(AuthApiFactory factory)
        {
            _factory = factory;
            _factory.EmailSender.Clear();
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task RegisterStudent_ReturnsStudentRole_AndDashboardStartsEmpty()
        {
            var request = CreateStudentRegisterRequest();

            var response = await _client.PostAsJsonAsync("/api/auth/register/student", request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.Equal(IdentityRoles.Student, payload!.PrimaryRole);
            Assert.Contains(IdentityRoles.Student, payload.Roles);

            using var dashboardRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                "/api/student/dashboard",
                payload.AccessToken);

            var dashboardResponse = await _client.SendAsync(dashboardRequest);
            Assert.Equal(HttpStatusCode.OK, dashboardResponse.StatusCode);

            var dashboard = await dashboardResponse.Content.ReadFromJsonAsync<StudentDashboardDto>(JsonOptions);
            Assert.NotNull(dashboard);
            Assert.Empty(dashboard!.Classes);
            Assert.Empty(dashboard.PendingInvites);
            Assert.Equal(StudentOnboardingState.Active.ToString(), dashboard.OnboardingState);
        }

        [Fact]
        public async Task ImportRoster_WithNewEmail_CreatesInvitedStudentAndSendsActivationEmail()
        {
            var teacherAuth = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(teacherAuth, new CreateTeacherClassRequestDto
            {
                Name = "Biology 10A"
            });

            _factory.EmailSender.Clear();

            var batch = await ImportRosterAsync(
                teacherAuth.AccessToken,
                classroom.Id,
                new ImportStudentRosterRequestDto
                {
                    SourceFileName = "biology.csv",
                    Students = new[]
                    {
                        new StudentRosterItemInputDto
                        {
                            FullName = "Imported Student",
                            StudentCode = "BIO-001",
                            Email = "imported.student@example.test"
                        }
                    }
                });

            Assert.Equal(1, batch.CreatedAccountCount);
            Assert.Equal(0, batch.SentInviteCount);
            Assert.Equal(StudentImportItemResultType.CreatedAccount.ToString(), batch.Items.Single().ResultType);

            var createdUser = await FindUserByEmailAsync("imported.student@example.test");
            Assert.NotNull(createdUser);

            using (var scope = _factory.Services.CreateScope())
            {
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var roles = await userManager.GetRolesAsync(createdUser!);
                Assert.Contains(IdentityRoles.Student, roles);
            }

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<examxy.Infrastructure.Persistence.AppDbContext>();
                var studentProfile = await dbContext.StudentProfiles.FindAsync(createdUser!.Id);
                Assert.NotNull(studentProfile);
                Assert.Equal(StudentOnboardingState.Invited, studentProfile!.OnboardingState);
            }

            var sentEmail = Assert.Single(_factory.EmailSender.GetMessages());
            Assert.Equal("imported.student@example.test", sentEmail.To);
            Assert.Contains("Activate your student account", sentEmail.Subject);
            Assert.Contains("/reset-password", sentEmail.TextBody);
            Assert.Contains("invite code", sentEmail.TextBody, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task ImportRoster_WithExistingStudent_SendsInviteWithoutCreatingDuplicateAccount()
        {
            var teacherAuth = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var studentRequest = CreateStudentRegisterRequest();
            var studentAuth = await RegisterStudentAsync(studentRequest);
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(teacherAuth, new CreateTeacherClassRequestDto
            {
                Name = "Chemistry 11B"
            });

            var batch = await ImportRosterAsync(
                teacherAuth.AccessToken,
                classroom.Id,
                new ImportStudentRosterRequestDto
                {
                    SourceFileName = "chemistry.csv",
                    Students = new[]
                    {
                        new StudentRosterItemInputDto
                        {
                            FullName = studentRequest.FullName,
                            StudentCode = studentRequest.StudentCode,
                            Email = studentRequest.Email
                        }
                    }
                });

            Assert.Equal(0, batch.CreatedAccountCount);
            Assert.Equal(1, batch.SentInviteCount);
            Assert.Equal(StudentImportItemResultType.SentInvite.ToString(), batch.Items.Single().ResultType);

            var reloadedUser = await FindUserByEmailAsync(studentRequest.Email);
            Assert.NotNull(reloadedUser);
            Assert.Equal(studentAuth.UserId, reloadedUser!.Id);

            var sentEmail = Assert.Single(_factory.EmailSender.GetMessages());
            Assert.Contains("Join", sentEmail.Subject);
        }

        [Fact]
        public async Task ImportRoster_WithExistingTeacherEmail_RejectsRow()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var anotherTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "History 12C"
            });

            var batch = await ImportRosterAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new ImportStudentRosterRequestDto
                {
                    SourceFileName = "history.csv",
                    Students = new[]
                    {
                        new StudentRosterItemInputDto
                        {
                            FullName = "Wrong Role User",
                            StudentCode = "HIS-001",
                            Email = anotherTeacher.Email
                        }
                    }
                });

            Assert.Equal(1, batch.RejectedCount);
            Assert.Equal(StudentImportItemResultType.RejectedWrongRole.ToString(), batch.Items.Single().ResultType);
        }

        [Fact]
        public async Task ClaimInvite_RequiresMatchingEmail_AndCanOnlyBeUsedOnce()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var otherStudent = await RegisterStudentAsync(CreateStudentRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Physics 10A"
            });

            await ImportRosterAsync(
                ownerTeacher.AccessToken,
                classroom.Id,
                new ImportStudentRosterRequestDto
                {
                    SourceFileName = "physics.csv",
                    Students = new[]
                    {
                        new StudentRosterItemInputDto
                        {
                            FullName = "Invited Student",
                            StudentCode = "PHY-001",
                            Email = "invited.student@example.test"
                        }
                    }
                });

            var activationEmail = Assert.Single(_factory.EmailSender.GetMessages());
            var inviteCode = ExtractInviteCode(activationEmail.TextBody);
            var resetToken = ExtractQueryParameter(activationEmail.TextBody, "token");

            using var wrongStudentClaim = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/student/invites/claim",
                otherStudent.AccessToken,
                new ClaimClassInviteRequestDto
                {
                    InviteCode = inviteCode
                });

            var mismatchResponse = await _client.SendAsync(wrongStudentClaim);
            Assert.Equal(HttpStatusCode.Forbidden, mismatchResponse.StatusCode);

            var mismatchError = await mismatchResponse.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(mismatchError);
            Assert.Equal("class_invite_email_mismatch", mismatchError!.Code);

            var resetResponse = await _client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequestDto
            {
                Email = "invited.student@example.test",
                Token = resetToken,
                NewPassword = "NewStudent123",
                ConfirmNewPassword = "NewStudent123"
            });
            Assert.Equal(HttpStatusCode.NoContent, resetResponse.StatusCode);

            var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = "invited.student@example.test",
                Password = "NewStudent123"
            });
            Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

            var invitedStudentAuth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(invitedStudentAuth);

            using var claimRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/student/invites/claim",
                invitedStudentAuth!.AccessToken,
                new ClaimClassInviteRequestDto
                {
                    InviteCode = inviteCode
                });

            var claimResponse = await _client.SendAsync(claimRequest);
            Assert.Equal(HttpStatusCode.OK, claimResponse.StatusCode);

            using var secondClaimRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/student/invites/claim",
                invitedStudentAuth.AccessToken,
                new ClaimClassInviteRequestDto
                {
                    InviteCode = inviteCode
                });

            var secondClaimResponse = await _client.SendAsync(secondClaimRequest);
            Assert.Equal(HttpStatusCode.Conflict, secondClaimResponse.StatusCode);

            var secondClaimError = await secondClaimResponse.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(secondClaimError);
            Assert.Equal("class_invite_used", secondClaimError!.Code);
        }

        [Fact]
        public async Task Teachers_CannotAccessClassesOwnedByAnotherTeacher()
        {
            var ownerTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var otherTeacher = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(ownerTeacher, new CreateTeacherClassRequestDto
            {
                Name = "Literature 11A"
            });

            using var detailRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/teacher/classes/{classroom.Id}",
                otherTeacher.AccessToken);

            var detailResponse = await _client.SendAsync(detailRequest);
            Assert.Equal(HttpStatusCode.NotFound, detailResponse.StatusCode);
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
                "/api/teacher/classes",
                teacherAuth.AccessToken,
                request);

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<TeacherClassSummaryDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<StudentImportBatchDto> ImportRosterAsync(
            string accessToken,
            Guid classId,
            ImportStudentRosterRequestDto request)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/teacher/classes/{classId}/roster-imports",
                accessToken,
                request);

            var response = await _client.SendAsync(message);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException(
                    $"Import roster failed with {(int)response.StatusCode}: {body}");
            }

            var payload = await response.Content.ReadFromJsonAsync<StudentImportBatchDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<ApplicationUser?> FindUserByEmailAsync(string email)
        {
            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            return await userManager.FindByEmailAsync(email);
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

        private static string ExtractQueryParameter(string? textBody, string key)
        {
            Assert.False(string.IsNullOrWhiteSpace(textBody));

            var match = Regex.Match(textBody!, @"https?://\S+");
            Assert.True(match.Success);

            var link = match.Value;
            var uri = new Uri(link);
            var query = QueryHelpers.ParseQuery(uri.Query);

            Assert.True(query.TryGetValue(key, out var value));
            return value.ToString();
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
