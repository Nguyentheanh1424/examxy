using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

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
        public async Task CreateClass_PersistsPhase2SetupMetadata()
        {
            var teacherAuth = await RegisterTeacherAsync(CreateTeacherRegisterRequest());

            var classroom = await CreateClassAsync(teacherAuth, new CreateTeacherClassRequestDto
            {
                Name = "Physics 10A",
                Code = "PHY-10A",
                Subject = "Physics",
                Grade = "10",
                Term = "Semester 1 2026-2027",
                JoinMode = "CodeJoin"
            });

            Assert.Equal("Physics", classroom.Subject);
            Assert.Equal("10", classroom.Grade);
            Assert.Equal("Semester 1 2026-2027", classroom.Term);
            Assert.Equal("CodeJoin", classroom.JoinMode);

            var detail = await GetClassDetailAsync(teacherAuth.AccessToken, classroom.Id);
            Assert.Equal(classroom.Subject, detail.Subject);
            Assert.Equal(classroom.Grade, detail.Grade);
            Assert.Equal(classroom.Term, detail.Term);
            Assert.Equal(classroom.JoinMode, detail.JoinMode);
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
                $"/api/classes/{classroom.Id}",
                otherTeacher.AccessToken);

            var detailResponse = await _client.SendAsync(detailRequest);
            Assert.Equal(HttpStatusCode.NotFound, detailResponse.StatusCode);
        }

        [Fact]
        public async Task DeleteMembership_RemovesMembershipRecord()
        {
            var teacherAuth = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(teacherAuth, new CreateTeacherClassRequestDto
            {
                Name = "Math 9A"
            });

            await ImportRosterAsync(
                teacherAuth.AccessToken,
                classroom.Id,
                new ImportStudentRosterRequestDto
                {
                    SourceFileName = "math.csv",
                    Students = new[]
                    {
                        new StudentRosterItemInputDto
                        {
                            FullName = "Student Delete Membership",
                            StudentCode = "MTH-001",
                            Email = "delete.membership.student@example.test"
                        }
                    }
                });

            var activationEmail = Assert.Single(_factory.EmailSender.GetMessages());
            var inviteCode = ExtractInviteCode(activationEmail.TextBody);
            var resetToken = ExtractQueryParameter(activationEmail.TextBody, "token");

            var resetResponse = await _client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequestDto
            {
                Email = "delete.membership.student@example.test",
                Token = resetToken,
                NewPassword = "NewStudent123",
                ConfirmNewPassword = "NewStudent123"
            });
            Assert.Equal(HttpStatusCode.NoContent, resetResponse.StatusCode);

            var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = "delete.membership.student@example.test",
                Password = "NewStudent123"
            });
            Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

            var studentAuth = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(studentAuth);

            using (var claimRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/student/invites/claim",
                studentAuth!.AccessToken,
                new ClaimClassInviteRequestDto
                {
                    InviteCode = inviteCode
                }))
            {
                var claimResponse = await _client.SendAsync(claimRequest);
                Assert.Equal(HttpStatusCode.OK, claimResponse.StatusCode);
            }

            var classDetailBeforeDelete = await GetClassDetailAsync(teacherAuth.AccessToken, classroom.Id);
            var membershipId = Assert.Single(classDetailBeforeDelete.Memberships).Id;

            using (var deleteRequest = CreateAuthenticatedRequest(
                HttpMethod.Delete,
                $"/api/classes/{classroom.Id}/memberships/{membershipId}",
                teacherAuth.AccessToken))
            {
                var deleteResponse = await _client.SendAsync(deleteRequest);
                Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
            }

            var classDetailAfterDelete = await GetClassDetailAsync(teacherAuth.AccessToken, classroom.Id);
            Assert.Empty(classDetailAfterDelete.Memberships);
        }

        [Fact]
        public async Task ResendInvite_CreatesNewPendingInviteAndSendsEmail()
        {
            var teacherAuth = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(teacherAuth, new CreateTeacherClassRequestDto
            {
                Name = "History 8A"
            });

            await ImportRosterAsync(
                teacherAuth.AccessToken,
                classroom.Id,
                new ImportStudentRosterRequestDto
                {
                    SourceFileName = "history.csv",
                    Students = new[]
                    {
                        new StudentRosterItemInputDto
                        {
                            FullName = "Resend Invite Student",
                            StudentCode = "HIS-001",
                            Email = "resend.invite.student@example.test"
                        }
                    }
                });

            Assert.Single(_factory.EmailSender.GetMessages());
            _factory.EmailSender.Clear();

            var classDetail = await GetClassDetailAsync(teacherAuth.AccessToken, classroom.Id);
            var originalInvite = Assert.Single(classDetail.Invites);

            using var resendRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classroom.Id}/invites/{originalInvite.Id}/resend",
                teacherAuth.AccessToken);

            var resendResponse = await _client.SendAsync(resendRequest);
            Assert.Equal(HttpStatusCode.OK, resendResponse.StatusCode);

            var resentInvite = await resendResponse.Content.ReadFromJsonAsync<ClassInviteDto>(JsonOptions);
            Assert.NotNull(resentInvite);
            Assert.NotEqual(originalInvite.Id, resentInvite!.Id);
            Assert.Equal("Pending", resentInvite.Status);

            var sentEmail = Assert.Single(_factory.EmailSender.GetMessages());
            Assert.Equal("resend.invite.student@example.test", sentEmail.To);
            Assert.Contains("Join", sentEmail.Subject);
        }

        [Fact]
        public async Task CancelInvite_ChangesStatusToCancelled_AndSecondCancelReturnsConflict()
        {
            var teacherAuth = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(teacherAuth, new CreateTeacherClassRequestDto
            {
                Name = "Geography 8B"
            });

            await ImportRosterAsync(
                teacherAuth.AccessToken,
                classroom.Id,
                new ImportStudentRosterRequestDto
                {
                    SourceFileName = "geo.csv",
                    Students = new[]
                    {
                        new StudentRosterItemInputDto
                        {
                            FullName = "Cancel Invite Student",
                            StudentCode = "GEO-001",
                            Email = "cancel.invite.student@example.test"
                        }
                    }
                });

            var classDetail = await GetClassDetailAsync(teacherAuth.AccessToken, classroom.Id);
            var invite = Assert.Single(classDetail.Invites);

            using var cancelRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classroom.Id}/invites/{invite.Id}/cancel",
                teacherAuth.AccessToken);

            var cancelResponse = await _client.SendAsync(cancelRequest);
            Assert.Equal(HttpStatusCode.OK, cancelResponse.StatusCode);

            var cancelledInvite = await cancelResponse.Content.ReadFromJsonAsync<ClassInviteDto>(JsonOptions);
            Assert.NotNull(cancelledInvite);
            Assert.Equal("Cancelled", cancelledInvite!.Status);

            using var cancelAgainRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classroom.Id}/invites/{invite.Id}/cancel",
                teacherAuth.AccessToken);

            var cancelAgainResponse = await _client.SendAsync(cancelAgainRequest);
            Assert.Equal(HttpStatusCode.Conflict, cancelAgainResponse.StatusCode);
        }

        [Fact]
        public async Task AddStudentByEmail_WithNewEmail_CreatesInvitedStudentAndSendsActivationEmail()
        {
            var teacherAuth = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            _factory.EmailSender.Clear();

            var classroom = await CreateClassAsync(teacherAuth, new CreateTeacherClassRequestDto
            {
                Name = "English 7A"
            });

            using var addRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classroom.Id}/students",
                teacherAuth.AccessToken,
                new AddStudentByEmailRequestDto
                {
                    Email = "single.add.student@example.test"
                });

            var addResponse = await _client.SendAsync(addRequest);
            Assert.Equal(HttpStatusCode.OK, addResponse.StatusCode);

            var payload = await addResponse.Content.ReadFromJsonAsync<StudentImportItemDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.Equal(StudentImportItemResultType.CreatedAccount.ToString(), payload!.ResultType);

            var sentEmail = Assert.Single(_factory.EmailSender.GetMessages());
            Assert.Equal("single.add.student@example.test", sentEmail.To);
            Assert.Contains("Activate your student account", sentEmail.Subject);
        }

        [Fact]
        public async Task PreviewRosterImport_ValidatesRowsWithoutMutatingData()
        {
            var teacherAuth = await RegisterTeacherAsync(CreateTeacherRegisterRequest());
            var classroom = await CreateClassAsync(teacherAuth, new CreateTeacherClassRequestDto
            {
                Name = "Preview Class"
            });
            _factory.EmailSender.Clear();

            var request = new ImportStudentRosterRequestDto
            {
                SourceFileName = "preview.csv",
                Students = new[]
                {
                    new StudentRosterItemInputDto
                    {
                        FullName = "Preview Student",
                        StudentCode = "PV-001",
                        Email = "preview.student@example.test"
                    },
                    new StudentRosterItemInputDto
                    {
                        FullName = "Duplicate Student",
                        StudentCode = "PV-002",
                        Email = "preview.student@example.test"
                    }
                }
            };

            using var previewMessage = CreateAuthenticatedRequest(
                HttpMethod.Post,
                $"/api/classes/{classroom.Id}/roster-imports/preview",
                teacherAuth.AccessToken,
                request);

            var previewResponse = await _client.SendAsync(previewMessage);
            Assert.Equal(HttpStatusCode.OK, previewResponse.StatusCode);

            var preview = await previewResponse.Content.ReadFromJsonAsync<RosterImportPreviewDto>(JsonOptions);
            Assert.NotNull(preview);
            Assert.Equal(2, preview!.TotalRows);
            Assert.Equal(1, preview.ReadyCount);
            Assert.Equal(1, preview.ErrorCount);
            Assert.Contains(preview.Items, item => item.Action == "CreateAccount");
            Assert.Contains(preview.Items, item => item.Action == "Reject");

            var detailBeforeImport = await GetClassDetailAsync(teacherAuth.AccessToken, classroom.Id);
            Assert.Empty(detailBeforeImport.ImportBatches);
            Assert.Empty(_factory.EmailSender.GetMessages());
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

        private async Task<StudentImportBatchDto> ImportRosterAsync(
            string accessToken,
            Guid classId,
            ImportStudentRosterRequestDto request)
        {
            using var message = new HttpRequestMessage(
                HttpMethod.Post,
                $"/api/classes/{classId}/roster-imports");
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var csv = BuildCsv(request.Students);
            var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes(csv));
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");

            var multipart = new MultipartFormDataContent();
            multipart.Add(
                fileContent,
                "file",
                string.IsNullOrWhiteSpace(request.SourceFileName) ? "roster.csv" : request.SourceFileName);

            message.Content = multipart;

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

        private static string BuildCsv(IReadOnlyCollection<StudentRosterItemInputDto> students)
        {
            static string Escape(string? value)
            {
                var text = value ?? string.Empty;
                if (!text.Contains(',') && !text.Contains('"') && !text.Contains('\n') && !text.Contains('\r'))
                {
                    return text;
                }

                return $"\"{text.Replace("\"", "\"\"")}\"";
            }

            var builder = new StringBuilder();
            builder.AppendLine("fullName,studentCode,email");
            foreach (var student in students)
            {
                builder
                    .Append(Escape(student.FullName))
                    .Append(',')
                    .Append(Escape(student.StudentCode))
                    .Append(',')
                    .Append(Escape(student.Email))
                    .AppendLine();
            }

            return builder.ToString();
        }

        private async Task<TeacherClassDetailDto> GetClassDetailAsync(
            string accessToken,
            Guid classId)
        {
            using var message = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/classes/{classId}",
                accessToken);

            var response = await _client.SendAsync(message);
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<TeacherClassDetailDto>(JsonOptions);
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
