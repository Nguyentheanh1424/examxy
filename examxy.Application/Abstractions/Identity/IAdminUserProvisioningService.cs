using examxy.Application.Abstractions.Identity.DTOs;

namespace examxy.Application.Abstractions.Identity
{
    public interface IAdminUserProvisioningService
    {
        Task<ProvisionedUserDto> ProvisionAdminAsync(
            ProvisionAdminUserRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
