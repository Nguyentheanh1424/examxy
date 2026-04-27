using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Infrastructure.Identity;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace examxy.Server.Controllers
{
    /// <summary>
    /// Internal operational endpoints for administrator provisioning.
    /// </summary>
    /// <remarks>
    /// These routes are not public signup APIs. They require the shared secret header configured
    /// in <c>InternalAdminProvisioning</c> and are intended for trusted operational workflows only.
    /// </remarks>
    [ApiController]
    [AllowAnonymous]
    [Route("internal/admin-users")]
    public sealed class InternalAdminUsersController : ControllerBase
    {
        private readonly IAdminUserProvisioningService _adminUserProvisioningService;
        private readonly InternalAdminProvisioningOptions _options;

        public InternalAdminUsersController(
            IAdminUserProvisioningService adminUserProvisioningService,
            IOptions<InternalAdminProvisioningOptions> options)
        {
            _adminUserProvisioningService = adminUserProvisioningService;
            _options = options.Value;
        }

        /// <summary>
        /// Provision a new administrator account with the Admin role.
        /// </summary>
        /// <remarks>
        /// Flow: a trusted internal caller submits the shared secret header plus the admin profile payload
        /// -&gt; the account is created or rejected on conflict -&gt; the response returns the provisioned Admin identity.
        /// This endpoint is internal-only and should not be exposed as a public self-service path.
        /// </remarks>
        [HttpPost]
        [ProducesResponseType(typeof(ProvisionedUserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ProvisionedUserDto>> ProvisionAdmin(
            [FromBody] ProvisionAdminUserRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!Request.Headers.TryGetValue(_options.HeaderName, out var providedSecret) ||
                !string.Equals(providedSecret.ToString(), _options.SharedSecret, StringComparison.Ordinal))
            {
                throw new ForbiddenException("The internal admin provisioning secret is invalid.");
            }

            var response = await _adminUserProvisioningService.ProvisionAdminAsync(
                request,
                cancellationToken);

            return Ok(response);
        }
    }
}
