using examxy.Application.Abstractions.Identity;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace test.Integration.Auth
{
    public sealed class IdentityRoleMigrationTests : IClassFixture<AuthApiFactory>
    {
        private readonly AuthApiFactory _factory;

        public IdentityRoleMigrationTests(AuthApiFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task SeedAsync_MigratesLegacyUserRoleToTeacherAndCreatesTeacherProfile()
        {
            using var scope = _factory.Services.CreateScope();
            var identityAdministrationService = scope.ServiceProvider.GetRequiredService<IIdentityAdministrationService>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (!await roleManager.RoleExistsAsync(IdentityRoles.LegacyUser))
            {
                var createRoleResult = await roleManager.CreateAsync(new IdentityRole(IdentityRoles.LegacyUser));
                Assert.True(createRoleResult.Succeeded);
            }

            var legacyUser = new ApplicationUser
            {
                UserName = $"legacy-{Guid.NewGuid():N}",
                Email = $"legacy-{Guid.NewGuid():N}@example.test",
                EmailConfirmed = true,
                FullName = "Legacy User"
            };

            var createUserResult = await userManager.CreateAsync(legacyUser, "Pass123");
            Assert.True(createUserResult.Succeeded);

            var addRoleResult = await userManager.AddToRoleAsync(legacyUser, IdentityRoles.LegacyUser);
            Assert.True(addRoleResult.Succeeded);

            var migrationResult = await identityAdministrationService.MigrateLegacyUsersAsync();
            var profileResult = await identityAdministrationService.BackfillMissingProfilesAsync();

            var roles = await userManager.GetRolesAsync(legacyUser);
            Assert.Contains(IdentityRoles.Teacher, roles);
            Assert.DoesNotContain(IdentityRoles.LegacyUser, roles);
            Assert.Equal(1, migrationResult.ChangedCount);
            Assert.True(profileResult.ChangedCount >= 1);

            var teacherProfile = await dbContext.TeacherProfiles.FindAsync(legacyUser.Id);
            Assert.NotNull(teacherProfile);
        }
    }
}
