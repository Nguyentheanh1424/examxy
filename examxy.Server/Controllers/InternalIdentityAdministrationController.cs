using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using examxy.Server.Contracts;

namespace examxy.Server.Controllers
{
    /// <summary>
    /// Internal operational endpoints for auditing and repairing identity consistency.
    /// </summary>
    /// <remarks>
    /// These routes support maintenance work such as auditing primary roles, backfilling profiles,
    /// and migrating legacy user assignments. Every endpoint requires the shared secret header.
    /// </remarks>
    [ApiController]
    [AllowAnonymous]
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

        /// <summary>
        /// Audit identity integrity across roles and profile rows.
        /// </summary>
        /// <remarks>
        /// Flow: internal operator supplies the shared secret header -&gt; the system scans users, roles,
        /// and teacher/student profiles -&gt; the response reports mismatches and missing records that need repair.
        /// </remarks>
        [HttpGet("audit")]
        [ProducesResponseType(typeof(IdentityAuditReportDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IdentityAuditReportDto>> Audit(CancellationToken cancellationToken)
        {
            EnsureSecret();
            var response = await _identityAdministrationService.AuditIdentityIntegrityAsync(cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Repair users that are missing a primary role assignment.
        /// </summary>
        /// <remarks>
        /// Flow: audit identifies role gaps -&gt; an internal operator calls this endpoint -&gt;
        /// the system updates missing primary roles and reports how many users were scanned and changed.
        /// </remarks>
        [HttpPost("repair-primary-roles")]
        [ProducesResponseType(typeof(IdentityMaintenanceResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IdentityMaintenanceResultDto>> RepairPrimaryRoles(CancellationToken cancellationToken)
        {
            EnsureSecret();
            var response = await _identityAdministrationService.RepairMissingPrimaryRolesAsync(cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Backfill missing teacher or student profile rows based on existing role assignments.
        /// </summary>
        /// <remarks>
        /// Flow: audit reports missing profiles -&gt; internal operator triggers backfill -&gt;
        /// profile rows are created where the role model indicates they should exist.
        /// </remarks>
        [HttpPost("backfill-profiles")]
        [ProducesResponseType(typeof(IdentityMaintenanceResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IdentityMaintenanceResultDto>> BackfillProfiles(CancellationToken cancellationToken)
        {
            EnsureSecret();
            var response = await _identityAdministrationService.BackfillMissingProfilesAsync(cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Migrate legacy users and assignments into the current primary-role model.
        /// </summary>
        /// <remarks>
        /// Flow: internal operator runs migration maintenance -&gt; legacy user assignments are upgraded
        /// into the current role model -&gt; the response reports the scan size, changes made, and any warnings.
        /// </remarks>
        [HttpPost("migrate-legacy-users")]
        [ProducesResponseType(typeof(IdentityMaintenanceResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
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
