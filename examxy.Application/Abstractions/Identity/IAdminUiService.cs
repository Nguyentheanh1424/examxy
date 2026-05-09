using examxy.Application.Abstractions.Identity.DTOs;

namespace examxy.Application.Abstractions.Identity
{
    public interface IAdminUiService
    {
        Task<AdminDashboardSummaryDto> GetDashboardAsync(
            CancellationToken cancellationToken = default);

        Task<AdminPagedResultDto<AdminUserSummaryDto>> GetUsersAsync(
            AdminUsersQueryDto query,
            CancellationToken cancellationToken = default);

        Task<AdminPagedResultDto<AdminAuditEventDto>> GetAuditEventsAsync(
            AdminAuditQueryDto query,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<AdminSystemHealthSummaryDto>> GetSystemHealthAsync(
            CancellationToken cancellationToken = default);
    }
}
