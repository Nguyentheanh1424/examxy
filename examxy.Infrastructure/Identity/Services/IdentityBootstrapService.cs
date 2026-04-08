using examxy.Application.Abstractions.Identity;
using Microsoft.AspNetCore.Identity;

namespace examxy.Infrastructure.Identity.Services
{
    public sealed class IdentityBootstrapService
    {
        private readonly RoleManager<IdentityRole> _roleManager;

        public IdentityBootstrapService(RoleManager<IdentityRole> roleManager)
        {
            _roleManager = roleManager;
        }

        public async Task EnsureSystemRolesAsync(CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            foreach (var roleName in IdentityRoles.SupportedRoles)
            {
                if (await _roleManager.RoleExistsAsync(roleName))
                {
                    continue;
                }

                var result = await _roleManager.CreateAsync(new IdentityRole(roleName));
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to bootstrap role '{roleName}': {string.Join("; ", result.Errors.Select(error => error.Description))}");
                }
            }
        }
    }
}
