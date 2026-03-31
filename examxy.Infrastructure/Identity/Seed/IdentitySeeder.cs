using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace examxy.Infrastructure.Identity.Seed
{
    public class IdentitySeeder
    {
        private const string AdminRole = "Admin";
        private const string UserRole = "User";

        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<IdentitySeeder> _logger;

        public IdentitySeeder(
            RoleManager<IdentityRole> roleManager,
            UserManager<ApplicationUser> userManager,
            IConfiguration configuration,
            ILogger<IdentitySeeder> logger)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            await SeedRolesAsync();
            await SeedAdminAsync();
        }

        private async Task SeedRolesAsync()
        {
            var roles = new[] { AdminRole, UserRole };

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

            var existingAdminByEmail = await _userManager.FindByEmailAsync(adminEmail);
            if (existingAdminByEmail is not null)
            {
                await EnsureUserInRoleAsync(existingAdminByEmail, AdminRole);
                return;
            }

            var existingAdminByUserName = await _userManager.FindByNameAsync(adminUserName);
            if (existingAdminByUserName is not null)
            {
                await EnsureUserInRoleAsync(existingAdminByUserName, AdminRole);
                return;
            }

            var adminUser = new ApplicationUser
            {
                UserName = adminUserName,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(adminUser, adminPassword);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to seed admin user: {BuildIdentityErrorMessage(createResult.Errors)}");
            }

            var addToRoleResult = await _userManager.AddToRoleAsync(adminUser, AdminRole);
            if (!addToRoleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to assign '{AdminRole}' role to admin user: {BuildIdentityErrorMessage(addToRoleResult.Errors)}");
            }

            _logger.LogInformation(
                "Seeded admin user with email {Email} and username {UserName}",
                adminEmail,
                adminUserName);
        }

        private async Task EnsureUserInRoleAsync(ApplicationUser user, string role)
        {
            var isInRole = await _userManager.IsInRoleAsync(user, role);
            if (isInRole)
            {
                return;
            }

            var addToRoleResult = await _userManager.AddToRoleAsync(user, role);
            if (!addToRoleResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to assign '{role}' role to existing user: {BuildIdentityErrorMessage(addToRoleResult.Errors)}");
            }

            _logger.LogInformation(
                "Assigned role {Role} to existing user {UserId}",
                role,
                user.Id);
        }

        private static string BuildIdentityErrorMessage(IEnumerable<IdentityError> errors)
        {
            return string.Join("; ", errors.Select(e => e.Description));
        }
    }
}
