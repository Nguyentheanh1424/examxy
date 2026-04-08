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

        [HttpPost]
        [ProducesResponseType(typeof(ProvisionedUserDto), StatusCodes.Status200OK)]
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
