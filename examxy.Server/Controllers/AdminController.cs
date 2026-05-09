using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Server.Contracts;
using examxy.Server.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    /// <summary>
    /// Browser-safe administrator read APIs for the Admin UI workspace.
    /// </summary>
    [ApiController]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [Route("api/admin")]
    public sealed class AdminController : ControllerBase
    {
        private readonly IAdminUiService _adminUiService;

        public AdminController(IAdminUiService adminUiService)
        {
            _adminUiService = adminUiService;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(AdminDashboardSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<AdminDashboardSummaryDto>> GetDashboard(
            CancellationToken cancellationToken)
        {
            var response = await _adminUiService.GetDashboardAsync(cancellationToken);
            return Ok(response);
        }

        [HttpGet("users")]
        [ProducesResponseType(typeof(AdminPagedResultDto<AdminUserSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<AdminPagedResultDto<AdminUserSummaryDto>>> GetUsers(
            [FromQuery] AdminUsersQueryDto query,
            CancellationToken cancellationToken)
        {
            var response = await _adminUiService.GetUsersAsync(query, cancellationToken);
            return Ok(response);
        }

        [HttpGet("audit")]
        [ProducesResponseType(typeof(AdminPagedResultDto<AdminAuditEventDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<AdminPagedResultDto<AdminAuditEventDto>>> GetAuditEvents(
            [FromQuery] AdminAuditQueryDto query,
            CancellationToken cancellationToken)
        {
            var response = await _adminUiService.GetAuditEventsAsync(query, cancellationToken);
            return Ok(response);
        }

        [HttpGet("system-health")]
        [ProducesResponseType(typeof(IReadOnlyCollection<AdminSystemHealthSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IReadOnlyCollection<AdminSystemHealthSummaryDto>>> GetSystemHealth(
            CancellationToken cancellationToken)
        {
            var response = await _adminUiService.GetSystemHealthAsync(cancellationToken);
            return Ok(response);
        }
    }
}
