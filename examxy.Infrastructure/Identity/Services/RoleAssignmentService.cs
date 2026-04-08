using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using Microsoft.AspNetCore.Identity;

namespace examxy.Infrastructure.Identity.Services
{
    public sealed class RoleAssignmentService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public RoleAssignmentService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task EnsureRoleExistsAsync(string roleName)
        {
            if (await _roleManager.RoleExistsAsync(roleName))
            {
                return;
            }

            var createRoleResult = await _roleManager.CreateAsync(new IdentityRole(roleName));
            if (!createRoleResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(
                    createRoleResult.Errors,
                    $"Failed to create the '{roleName}' role.");
            }
        }

        public async Task SetSingleRoleAsync(ApplicationUser user, string roleName)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                throw new InvalidOperationException(
                    $"The '{roleName}' role does not exist. Bootstrap the system roles before assigning roles.");
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            var rolesToRemove = currentRoles
                .Where(role => !string.Equals(role, roleName, StringComparison.OrdinalIgnoreCase))
                .ToArray();

            if (rolesToRemove.Length > 0)
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
                if (!removeResult.Succeeded)
                {
                    throw IdentityExceptionFactory.CreateFromErrors(
                        removeResult.Errors,
                        "Failed to remove existing roles.");
                }
            }

            if (!currentRoles.Any(role => string.Equals(role, roleName, StringComparison.OrdinalIgnoreCase)))
            {
                var addResult = await _userManager.AddToRoleAsync(user, roleName);
                if (!addResult.Succeeded)
                {
                    throw IdentityExceptionFactory.CreateFromErrors(
                        addResult.Errors,
                        $"Failed to assign the '{roleName}' role.");
                }
            }
        }

        public async Task<string> GetPrimaryRoleAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = IdentityRoles.GetPrimaryRole(roles);

            if (string.IsNullOrWhiteSpace(primaryRole))
            {
                throw new RuleViolationException(
                    "The account does not have a supported primary role.",
                    "missing_primary_role");
            }

            return primaryRole;
        }
    }
}
