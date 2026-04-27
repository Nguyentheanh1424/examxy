using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.Classrooms;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Server.Contracts;
using examxy.Server.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    /// <summary>
    /// Student-only dashboard API.
    /// </summary>
    /// <remarks>
    /// This endpoint is the main landing API after student registration or login.
    /// It supports both empty-state onboarding and students who already belong to one or more classes.
    /// </remarks>
    [ApiController]
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [Route("api/student/dashboard")]
    public sealed class StudentDashboardController : ControllerBase
    {
        private readonly IStudentOnboardingService _studentOnboardingService;
        private readonly ICurrentUserService _currentUserService;

        public StudentDashboardController(
            IStudentOnboardingService studentOnboardingService,
            ICurrentUserService currentUserService)
        {
            _studentOnboardingService = studentOnboardingService;
            _currentUserService = currentUserService;
        }

        /// <summary>
        /// Return the authenticated student's dashboard data, including classes and pending invites.
        /// </summary>
        /// <remarks>
        /// Flow: student signs in or completes self-signup -&gt; client loads this dashboard endpoint
        /// -&gt; the UI renders current memberships, pending invites, and onboarding state.
        /// The endpoint still succeeds when the student has not joined any classes yet.
        /// </remarks>
        [HttpGet]
        [ProducesResponseType(typeof(StudentDashboardDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<StudentDashboardDto>> GetDashboard(
            CancellationToken cancellationToken)
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            var response = await _studentOnboardingService.GetDashboardAsync(
                _currentUserService.UserId,
                cancellationToken);

            return Ok(response);
        }
    }
}
