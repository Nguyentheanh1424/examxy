using examxy.Application.Abstractions.Classrooms;
using examxy.Application.Abstractions.Classrooms.DTOs;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    [ApiController]
    [Authorize(Roles = IdentityRoles.Student)]
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

        [HttpPost("claim")]
        [ProducesResponseType(typeof(ClaimClassInviteResultDto), StatusCodes.Status200OK)]
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
