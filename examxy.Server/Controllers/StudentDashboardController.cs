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

        [HttpGet]
        [ProducesResponseType(typeof(StudentDashboardDto), StatusCodes.Status200OK)]
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
