using examxy.Application.Exceptions;
using examxy.Application.Features.TestData;
using examxy.Application.Features.TestData.DTOs;
using examxy.Infrastructure.Identity;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace examxy.Server.Controllers
{
    /// <summary>
    /// Internal operational endpoints for deterministic test-data provisioning.
    /// </summary>
    /// <remarks>
    /// These routes are internal-only and require a dedicated shared secret header.
    /// They are enabled only in Development and Testing environments.
    /// </remarks>
    [ApiController]
    [AllowAnonymous]
    [Route("internal/test-data")]
    public sealed class InternalTestDataController : ControllerBase
    {
        private readonly ITestDataSeedService _testDataSeedService;
        private readonly InternalTestDataProvisioningOptions _options;
        private readonly IHostEnvironment _hostEnvironment;

        public InternalTestDataController(
            ITestDataSeedService testDataSeedService,
            IOptions<InternalTestDataProvisioningOptions> options,
            IHostEnvironment hostEnvironment)
        {
            _testDataSeedService = testDataSeedService;
            _options = options.Value;
            _hostEnvironment = hostEnvironment;
        }

        /// <summary>
        /// Seed deterministic class-dashboard test data profile V1.
        /// </summary>
        /// <remarks>
        /// Flow: internal operator calls this endpoint with the test-data shared secret -&gt;
        /// the system ensures test teacher/student accounts, class, and memberships exist without duplicates -&gt;
        /// the response returns a summary catalog of the seeded dataset.
        /// </remarks>
        [HttpPost("class-dashboard-v1-seed")]
        [ProducesResponseType(typeof(SeedClassDashboardTestDataResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<SeedClassDashboardTestDataResponseDto>> SeedClassDashboardV1(
            [FromBody] SeedClassDashboardTestDataRequestDto request,
            CancellationToken cancellationToken)
        {
            EnsureEnvironmentAllowed();
            EnsureSecret();

            var response = await _testDataSeedService.SeedClassDashboardV1Async(request, cancellationToken);
            return Ok(response);
        }

        private void EnsureEnvironmentAllowed()
        {
            if (_hostEnvironment.IsDevelopment() || _hostEnvironment.IsEnvironment("Testing"))
            {
                return;
            }

            throw new NotFoundException("The requested resource was not found.");
        }

        private void EnsureSecret()
        {
            if (!Request.Headers.TryGetValue(_options.HeaderName, out var providedSecret) ||
                !string.Equals(providedSecret.ToString(), _options.SharedSecret, StringComparison.Ordinal))
            {
                throw new ForbiddenException("The internal test-data provisioning secret is invalid.");
            }
        }
    }
}
