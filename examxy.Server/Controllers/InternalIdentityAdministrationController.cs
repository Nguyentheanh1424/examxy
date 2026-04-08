using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace examxy.Server.Controllers
{
    [ApiController]
    [AllowAnonymous]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("internal/admin/identity")]
    public sealed class InternalIdentityAdministrationController : ControllerBase
    {
        private readonly IIdentityAdministrationService _identityAdministrationService;
        private readonly InternalAdminProvisioningOptions _options;

        public InternalIdentityAdministrationController(
            IIdentityAdministrationService identityAdministrationService,
            IOptions<InternalAdminProvisioningOptions> options)
        {
            _identityAdministrationService = identityAdministrationService;
            _options = options.Value;
        }

        [HttpGet("audit")]
        [ProducesResponseType(typeof(IdentityAuditReportDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<IdentityAuditReportDto>> Audit(CancellationToken cancellationToken)
        {
            EnsureSecret();
            var response = await _identityAdministrationService.AuditIdentityIntegrityAsync(cancellationToken);
            return Ok(response);
        }

        [HttpPost("repair-primary-roles")]
        [ProducesResponseType(typeof(IdentityMaintenanceResultDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<IdentityMaintenanceResultDto>> RepairPrimaryRoles(CancellationToken cancellationToken)
        {
            EnsureSecret();
            var response = await _identityAdministrationService.RepairMissingPrimaryRolesAsync(cancellationToken);
            return Ok(response);
        }

        [HttpPost("backfill-profiles")]
        [ProducesResponseType(typeof(IdentityMaintenanceResultDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<IdentityMaintenanceResultDto>> BackfillProfiles(CancellationToken cancellationToken)
        {
            EnsureSecret();
            var response = await _identityAdministrationService.BackfillMissingProfilesAsync(cancellationToken);
            return Ok(response);
        }

        [HttpPost("migrate-legacy-users")]
        [ProducesResponseType(typeof(IdentityMaintenanceResultDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<IdentityMaintenanceResultDto>> MigrateLegacyUsers(CancellationToken cancellationToken)
        {
            EnsureSecret();
            var response = await _identityAdministrationService.MigrateLegacyUsersAsync(cancellationToken);
            return Ok(response);
        }

        private void EnsureSecret()
        {
            if (!Request.Headers.TryGetValue(_options.HeaderName, out var providedSecret) ||
                !string.Equals(providedSecret.ToString(), _options.SharedSecret, StringComparison.Ordinal))
            {
                throw new ForbiddenException("The internal admin provisioning secret is invalid.");
            }
        }
    }
}
