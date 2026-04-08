using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;

namespace examxy.Infrastructure.Identity.Services
{
    public sealed class AdminUserProvisioningService : IAdminUserProvisioningService
    {
        private readonly IIdentityAdministrationService _identityAdministrationService;

        public AdminUserProvisioningService(
            IIdentityAdministrationService identityAdministrationService)
        {
            _identityAdministrationService = identityAdministrationService;
        }

        public async Task<ProvisionedUserDto> ProvisionAdminAsync(
            ProvisionAdminUserRequestDto request,
            CancellationToken cancellationToken = default)
        {
            return await _identityAdministrationService.ProvisionAdminAsync(request, cancellationToken);
        }
    }
}
