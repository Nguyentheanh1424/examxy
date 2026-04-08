using examxy.Application.Abstractions.Identity.DTOs;

namespace examxy.Application.Abstractions.Identity
{
    public interface IIdentityAdministrationService
    {
        Task<ProvisionedUserDto> ProvisionAdminAsync(
            ProvisionAdminUserRequestDto request,
            CancellationToken cancellationToken = default);

        Task<IdentityAuditReportDto> AuditIdentityIntegrityAsync(
            CancellationToken cancellationToken = default);

        Task<IdentityMaintenanceResultDto> RepairMissingPrimaryRolesAsync(
            CancellationToken cancellationToken = default);

        Task<IdentityMaintenanceResultDto> BackfillMissingProfilesAsync(
            CancellationToken cancellationToken = default);

        Task<IdentityMaintenanceResultDto> MigrateLegacyUsersAsync(
            CancellationToken cancellationToken = default);
    }
}
