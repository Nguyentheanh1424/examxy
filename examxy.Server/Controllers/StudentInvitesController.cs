using examxy.Application.Features.Classrooms;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using examxy.Server.Contracts;
using examxy.Server.Security;

namespace examxy.Server.Controllers
{
    /// <summary>
    /// Student-only endpoints for accepting class invitations.
    /// </summary>
    /// <remarks>
    /// These endpoints continue the student onboarding flow after the dashboard shows a pending invite
    /// or after the student receives an invite code from email.
    /// </remarks>
    [ApiController]
    [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
    [Route("api/student/invites")]
    public sealed class StudentInvitesController : ControllerBase
    {
        private readonly IStudentInvitationService _studentInvitationService;
        private readonly ICurrentUserService _currentUserService;

        public StudentInvitesController(
            IStudentInvitationService studentInvitationService,
            ICurrentUserService currentUserService)
        {
            _studentInvitationService = studentInvitationService;
            _currentUserService = currentUserService;
        }

        /// <summary>
        /// Claim a class invite code for the authenticated student.
        /// </summary>
        /// <remarks>
        /// Flow: student signs in -&gt; opens the dashboard -&gt; submits an invite code -&gt; the code is validated
        /// against status, expiration, and invited email -&gt; a class membership is created and returned.
        /// Invite codes are single-use and return <c>409</c> when the business rules are violated.
        /// </remarks>
        [HttpPost("claim")]
        [ProducesResponseType(typeof(ClaimClassInviteResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ClaimClassInviteResultDto>> ClaimInvite(
            [FromBody] ClaimClassInviteRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            var response = await _studentInvitationService.ClaimInviteAsync(
                _currentUserService.UserId,
                request,
                cancellationToken);

            return Ok(response);
        }
    }
}
