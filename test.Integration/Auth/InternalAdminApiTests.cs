using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Infrastructure.Identity;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace test.Integration.Auth
{
    public sealed class InternalAdminApiTests : IClassFixture<AuthApiFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AuthApiFactory _factory;
        private readonly HttpClient _client;

        public InternalAdminApiTests(AuthApiFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task Startup_DoesNotSeedAdminUserAutomatically()
        {
            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            var existingAdmin = await userManager.FindByEmailAsync("admin@examxy.test");

            Assert.Null(existingAdmin);
        }

        [Fact]
        public async Task ProvisionAdmin_WithoutSecretHeader_ReturnsForbidden()
        {
            var response = await _client.PostAsJsonAsync("/internal/admin-users", CreateRequest());

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task ProvisionAdmin_WithValidSecret_CreatesAdminAccount()
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/internal/admin-users")
            {
                Content = JsonContent.Create(CreateRequest())
            };
            request.Headers.Add("X-Examxy-Internal-Admin-Secret", "integration-admin-secret");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var payload = await response.Content.ReadFromJsonAsync<ProvisionedUserDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.Equal(IdentityRoles.Admin, payload!.PrimaryRole);
            Assert.Contains(IdentityRoles.Admin, payload.Roles);

            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var createdUser = await userManager.FindByEmailAsync(payload.Email);
            Assert.NotNull(createdUser);

            var roles = await userManager.GetRolesAsync(createdUser!);
            Assert.Contains(IdentityRoles.Admin, roles);
            Assert.DoesNotContain(IdentityRoles.Teacher, roles);
        }

        [Fact]
        public async Task Audit_WithValidSecret_ReportsMissingRoleAndLegacyAssignments()
        {
            using (var scope = _factory.Services.CreateScope())
            {
                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

                if (!await roleManager.RoleExistsAsync(IdentityRoles.LegacyUser))
                {
                    var createRoleResult = await roleManager.CreateAsync(new IdentityRole(IdentityRoles.LegacyUser));
                    Assert.True(createRoleResult.Succeeded);
                }

                var missingRoleUser = new ApplicationUser
                {
                    UserName = $"roleless-{Guid.NewGuid():N}",
                    Email = $"roleless-{Guid.NewGuid():N}@example.test",
                    EmailConfirmed = true,
                    FullName = "Roleless User",
                    CreatedAtUtc = DateTime.UtcNow
                };

                var legacyTeacherUser = new ApplicationUser
                {
                    UserName = $"legacy-{Guid.NewGuid():N}",
                    Email = $"legacy-{Guid.NewGuid():N}@example.test",
                    EmailConfirmed = true,
                    FullName = "Legacy User",
                    CreatedAtUtc = DateTime.UtcNow
                };

                Assert.True((await userManager.CreateAsync(missingRoleUser, "Pass123")).Succeeded);
                Assert.True((await userManager.CreateAsync(legacyTeacherUser, "Pass123")).Succeeded);
                Assert.True((await userManager.AddToRoleAsync(legacyTeacherUser, IdentityRoles.LegacyUser)).Succeeded);
                Assert.True((await userManager.AddToRoleAsync(legacyTeacherUser, IdentityRoles.Student)).Succeeded);
            }

            using var request = new HttpRequestMessage(HttpMethod.Get, "/internal/admin/identity/audit");
            request.Headers.Add("X-Examxy-Internal-Admin-Secret", "integration-admin-secret");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var payload = await response.Content.ReadFromJsonAsync<IdentityAuditReportDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.True(payload!.MissingPrimaryRoleCount >= 1);
            Assert.True(payload.LegacyAssignmentCount >= 1);
            Assert.Contains(payload.Issues, issue => issue.IssueType == "missing_primary_role");
            Assert.Contains(payload.Issues, issue => issue.IssueType == "legacy_role_assignment");
        }

        [Fact]
        public async Task RepairPrimaryRoles_WithValidSecret_AssignsTeacherRoleToRolelessUsers()
        {
            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var rolelessUser = new ApplicationUser
            {
                UserName = $"repair-{Guid.NewGuid():N}",
                Email = $"repair-{Guid.NewGuid():N}@example.test",
                EmailConfirmed = true,
                FullName = "Repair User",
                CreatedAtUtc = DateTime.UtcNow
            };

            Assert.True((await userManager.CreateAsync(rolelessUser, "Pass123")).Succeeded);

            using var request = new HttpRequestMessage(HttpMethod.Post, "/internal/admin/identity/repair-primary-roles");
            request.Headers.Add("X-Examxy-Internal-Admin-Secret", "integration-admin-secret");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var payload = await response.Content.ReadFromJsonAsync<IdentityMaintenanceResultDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.True(payload!.ChangedCount >= 1);

            var roles = await userManager.GetRolesAsync(rolelessUser);
            Assert.Contains(IdentityRoles.Teacher, roles);
        }

        [Fact]
        public async Task BackfillProfiles_WithValidSecret_CreatesMissingProfiles()
        {
            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var teacherUser = new ApplicationUser
            {
                UserName = $"teacher-{Guid.NewGuid():N}",
                Email = $"teacher-{Guid.NewGuid():N}@example.test",
                EmailConfirmed = true,
                FullName = "Teacher Without Profile",
                CreatedAtUtc = DateTime.UtcNow
            };

            Assert.True((await userManager.CreateAsync(teacherUser, "Pass123")).Succeeded);
            Assert.True((await userManager.AddToRoleAsync(teacherUser, IdentityRoles.Teacher)).Succeeded);

            using var request = new HttpRequestMessage(HttpMethod.Post, "/internal/admin/identity/backfill-profiles");
            request.Headers.Add("X-Examxy-Internal-Admin-Secret", "integration-admin-secret");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var payload = await response.Content.ReadFromJsonAsync<IdentityMaintenanceResultDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.True(payload!.ChangedCount >= 1);
            Assert.NotNull(await dbContext.TeacherProfiles.FindAsync(teacherUser.Id));
        }

        [Fact]
        public async Task MigrateLegacyUsers_WithValidSecret_UpdatesRoleAndRemovesLegacyAssignment()
        {
            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            if (!await roleManager.RoleExistsAsync(IdentityRoles.LegacyUser))
            {
                var createRoleResult = await roleManager.CreateAsync(new IdentityRole(IdentityRoles.LegacyUser));
                Assert.True(createRoleResult.Succeeded);
            }

            var legacyUser = new ApplicationUser
            {
                UserName = $"legacy-migrate-{Guid.NewGuid():N}",
                Email = $"legacy-migrate-{Guid.NewGuid():N}@example.test",
                EmailConfirmed = true,
                FullName = "Legacy Migrated User",
                CreatedAtUtc = DateTime.UtcNow
            };

            Assert.True((await userManager.CreateAsync(legacyUser, "Pass123")).Succeeded);
            Assert.True((await userManager.AddToRoleAsync(legacyUser, IdentityRoles.LegacyUser)).Succeeded);

            using var request = new HttpRequestMessage(HttpMethod.Post, "/internal/admin/identity/migrate-legacy-users");
            request.Headers.Add("X-Examxy-Internal-Admin-Secret", "integration-admin-secret");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var payload = await response.Content.ReadFromJsonAsync<IdentityMaintenanceResultDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.True(payload!.ChangedCount >= 1);

            var roles = await userManager.GetRolesAsync(legacyUser);
            Assert.Contains(IdentityRoles.Teacher, roles);
            Assert.DoesNotContain(IdentityRoles.LegacyUser, roles);
        }

        private static ProvisionAdminUserRequestDto CreateRequest()
        {
            var suffix = Guid.NewGuid().ToString("N");

            return new ProvisionAdminUserRequestDto
            {
                FullName = "Internal Admin",
                UserName = $"admin_{suffix}",
                Email = $"{suffix}@admin.example.test",
                Password = "Admin123",
                ConfirmPassword = "Admin123"
            };
        }
    }
}
