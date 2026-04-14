using examxy.Application.Abstractions.Identity;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity.Services;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace examxy.Infrastructure.Identity.Seed
{
    public class IdentitySeeder
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<IdentitySeeder> _logger;
        private readonly RoleAssignmentService _roleAssignmentService;
        private readonly AppDbContext _dbContext;

        public IdentitySeeder(
            RoleManager<IdentityRole> roleManager,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ILogger<IdentitySeeder> logger,
            RoleAssignmentService roleAssignmentService,
            AppDbContext dbContext)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
            _roleAssignmentService = roleAssignmentService;
            _dbContext = dbContext;
        }

        public async Task SeedAsync()
        {
            await SeedRolesAsync();
            await MigrateLegacyUsersAsync();
            await EnsurePrimaryRoleForRolelessUsersAsync();
            await SeedAdminAsync();
            await EnsureProfilesAsync();
        }

        private async Task SeedRolesAsync()
        {
            var roles = new[]
            {
                IdentityRoles.Admin,
                IdentityRoles.Teacher,
                IdentityRoles.Student
            };

            foreach (var role in roles)
            {
                var exists = await _roleManager.RoleExistsAsync(role);
                if (exists)
                {
                    continue;
                }

                var result = await _roleManager.CreateAsync(new IdentityRole(role));
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to seed role '{role}': {BuildIdentityErrorMessage(result.Errors)}");
                }

                _logger.LogInformation("Seeded role: {Role}", role);
            }
        }

        private async Task MigrateLegacyUsersAsync()
        {
            if (!await _roleManager.RoleExistsAsync(IdentityRoles.LegacyUser))
            {
                return;
            }

            var legacyUsers = await _userManager.GetUsersInRoleAsync(IdentityRoles.LegacyUser);
            foreach (var user in legacyUsers)
            {
                await _roleAssignmentService.SetSingleRoleAsync(user, IdentityRoles.Teacher);
            }

            var legacyRole = await _roleManager.FindByNameAsync(IdentityRoles.LegacyUser);
            if (legacyRole is not null)
            {
                var hasAssignments = await _dbContext.UserRoles
                    .AnyAsync(userRole => userRole.RoleId == legacyRole.Id);

                if (!hasAssignments)
                {
                    await _roleManager.DeleteAsync(legacyRole);
                }
            }
        }

        private async Task EnsurePrimaryRoleForRolelessUsersAsync()
        {
            var users = await _userManager.Users.ToListAsync();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var primaryRole = IdentityRoles.GetPrimaryRole(roles);

                if (string.IsNullOrWhiteSpace(primaryRole))
                {
                    await _roleAssignmentService.SetSingleRoleAsync(user, IdentityRoles.Teacher);
                }
            }
        }

        private async Task SeedAdminAsync()
        {
            var adminEmail = _configuration["IdentitySeed:AdminEmail"];
            var adminUserName = _configuration["IdentitySeed:AdminUserName"];
            var adminPassword = _configuration["IdentitySeed:AdminPassword"];

            if (string.IsNullOrWhiteSpace(adminEmail) ||
                string.IsNullOrWhiteSpace(adminUserName) ||
                string.IsNullOrWhiteSpace(adminPassword))
            {
                _logger.LogWarning(
                    "Identity seed admin configuration is missing. Skipping admin seeding.");
                return;
            }

            var existingAdmin = await _userManager.FindByEmailAsync(adminEmail)
                ?? await _userManager.FindByNameAsync(adminUserName);

            if (existingAdmin is null)
            {
                existingAdmin = new ApplicationUser
                {
                    UserName = adminUserName,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FullName = "Administrator",
                    CreatedAtUtc = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(existingAdmin, adminPassword);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to seed admin user: {BuildIdentityErrorMessage(createResult.Errors)}");
                }

                _logger.LogInformation(
                    "Seeded admin user with email {Email} and username {UserName}",
                    adminEmail,
                    adminUserName);
            }

            existingAdmin.EmailConfirmed = true;
            await _roleAssignmentService.SetSingleRoleAsync(existingAdmin, IdentityRoles.Admin);
        }

        private async Task EnsureProfilesAsync()
        {
            var teacherUsers = await _userManager.GetUsersInRoleAsync(IdentityRoles.Teacher);
            foreach (var teacher in teacherUsers)
            {
                if (!await _dbContext.TeacherProfiles.AnyAsync(profile => profile.UserId == teacher.Id))
                {
                    _dbContext.TeacherProfiles.Add(new TeacherProfile
                    {
                        UserId = teacher.Id,
                        CreatedAtUtc = teacher.CreatedAtUtc == default ? DateTime.UtcNow : teacher.CreatedAtUtc
                    });
                }
            }

            var studentUsers = await _userManager.GetUsersInRoleAsync(IdentityRoles.Student);
            foreach (var student in studentUsers)
            {
                if (!await _dbContext.StudentProfiles.AnyAsync(profile => profile.UserId == student.Id))
                {
                    _dbContext.StudentProfiles.Add(new StudentProfile
                    {
                        UserId = student.Id,
                        OnboardingState = StudentOnboardingState.Active,
                        CreatedAtUtc = student.CreatedAtUtc == default ? DateTime.UtcNow : student.CreatedAtUtc
                    });
                }
            }

            await _dbContext.SaveChangesAsync();
        }

        private static string BuildIdentityErrorMessage(IEnumerable<IdentityError> errors)
        {
            return string.Join("; ", errors.Select(e => e.Description));
        }
    }
}
