using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace test.Integration.Auth
{
    public sealed class AdminUiApiTests : IClassFixture<AuthApiFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AuthApiFactory _factory;
        private readonly HttpClient _client;

        public AdminUiApiTests(AuthApiFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task AdminDashboard_RequiresAdminRole()
        {
            var anonymousResponse = await _client.GetAsync("/api/admin/dashboard");
            Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);

            var teacherAuth = await CreateUserAndLoginAsync(IdentityRoles.Teacher);
            using var teacherRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                "/api/admin/dashboard",
                teacherAuth.AccessToken);

            var teacherResponse = await _client.SendAsync(teacherRequest);
            Assert.Equal(HttpStatusCode.Forbidden, teacherResponse.StatusCode);
        }

        [Fact]
        public async Task AdminUiEndpoints_ReturnProductionBackedData()
        {
            var adminAuth = await CreateUserAndLoginAsync(IdentityRoles.Admin);
            var teacher = await CreateUserAndLoginAsync(IdentityRoles.Teacher);
            await CreateIdentityAuditIssueAsync();

            using var dashboardRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                "/api/admin/dashboard",
                adminAuth.AccessToken);
            var dashboardResponse = await _client.SendAsync(dashboardRequest);
            Assert.Equal(HttpStatusCode.OK, dashboardResponse.StatusCode);

            var dashboard = await dashboardResponse.Content.ReadFromJsonAsync<AdminDashboardSummaryDto>(JsonOptions);
            Assert.NotNull(dashboard);
            Assert.Equal("ApiReady", dashboard!.ContractStatus);
            Assert.True(dashboard.UserCount >= 2);
            Assert.True(dashboard.ActiveTeacherCount >= 1);
            Assert.True(dashboard.UnresolvedAuditCount >= 1);

            using var usersRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                $"/api/admin/users?query={Uri.EscapeDataString(teacher.Email)}",
                adminAuth.AccessToken);
            var usersResponse = await _client.SendAsync(usersRequest);
            Assert.Equal(HttpStatusCode.OK, usersResponse.StatusCode);

            var users = await usersResponse.Content.ReadFromJsonAsync<AdminPagedResultDto<AdminUserSummaryDto>>(JsonOptions);
            Assert.NotNull(users);
            Assert.Contains(users!.Items, user =>
                user.Email == teacher.Email &&
                user.PrimaryRole == IdentityRoles.Teacher &&
                user.Status == "Active");

            using var auditRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                "/api/admin/audit?module=Identity",
                adminAuth.AccessToken);
            var auditResponse = await _client.SendAsync(auditRequest);
            Assert.Equal(HttpStatusCode.OK, auditResponse.StatusCode);

            var audit = await auditResponse.Content.ReadFromJsonAsync<AdminPagedResultDto<AdminAuditEventDto>>(JsonOptions);
            Assert.NotNull(audit);
            Assert.Contains(audit!.Items, auditEvent =>
                auditEvent.Module == "Identity" &&
                auditEvent.Severity == "Warning");

            using var healthRequest = CreateAuthenticatedRequest(
                HttpMethod.Get,
                "/api/admin/system-health",
                adminAuth.AccessToken);
            var healthResponse = await _client.SendAsync(healthRequest);
            Assert.Equal(HttpStatusCode.OK, healthResponse.StatusCode);

            var health = await healthResponse.Content.ReadFromJsonAsync<AdminSystemHealthSummaryDto[]>(JsonOptions);
            Assert.NotNull(health);
            Assert.Contains(health!, item => item.Service == "Server API" && item.Status == "Healthy");
            Assert.Contains(health!, item => item.Service == "Identity integrity");
        }

        private async Task<AuthResponseDto> CreateUserAndLoginAsync(string role)
        {
            var suffix = Guid.NewGuid().ToString("N");
            var email = $"{role.ToLowerInvariant()}-{suffix}@example.test";
            var password = "Admin123";

            using (var scope = _factory.Services.CreateScope())
            {
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var user = new ApplicationUser
                {
                    UserName = $"{role.ToLowerInvariant()}-{suffix}",
                    Email = email,
                    EmailConfirmed = true,
                    FullName = $"{role} User",
                    CreatedAtUtc = DateTime.UtcNow,
                    LastActivatedAtUtc = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(user, password);
                Assert.True(result.Succeeded);
                Assert.True((await userManager.AddToRoleAsync(user, role)).Succeeded);

                if (role == IdentityRoles.Teacher)
                {
                    dbContext.TeacherProfiles.Add(new TeacherProfile
                    {
                        UserId = user.Id,
                        CreatedAtUtc = user.CreatedAtUtc
                    });
                }
                else if (role == IdentityRoles.Student)
                {
                    dbContext.StudentProfiles.Add(new StudentProfile
                    {
                        UserId = user.Id,
                        CreatedAtUtc = user.CreatedAtUtc
                    });
                }

                await dbContext.SaveChangesAsync();
            }

            var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = email,
                Password = password
            });
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task CreateIdentityAuditIssueAsync()
        {
            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var suffix = Guid.NewGuid().ToString("N");
            var studentUser = new ApplicationUser
            {
                UserName = $"audit-student-{suffix}",
                Email = $"audit-student-{suffix}@example.test",
                EmailConfirmed = true,
                FullName = "Audit Student",
                CreatedAtUtc = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(studentUser, "Admin123");
            Assert.True(result.Succeeded);
            Assert.True((await userManager.AddToRoleAsync(studentUser, IdentityRoles.Student)).Succeeded);
        }

        private static HttpRequestMessage CreateAuthenticatedRequest(
            HttpMethod method,
            string requestUri,
            string accessToken)
        {
            var request = new HttpRequestMessage(method, requestUri);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer",
                accessToken);
            return request;
        }
    }
}
