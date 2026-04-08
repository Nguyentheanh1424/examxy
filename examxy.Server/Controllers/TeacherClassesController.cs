using examxy.Application.Abstractions.Classrooms;
using examxy.Application.Abstractions.Classrooms.DTOs;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    [ApiController]
    [Authorize(Roles = IdentityRoles.Teacher)]
    [Route("api/teacher/classes")]
    public sealed class TeacherClassesController : ControllerBase
    {
        private readonly ITeacherClassService _teacherClassService;
        private readonly ITeacherRosterImportService _teacherRosterImportService;
        private readonly ICurrentUserService _currentUserService;

        public TeacherClassesController(
            ITeacherClassService teacherClassService,
            ITeacherRosterImportService teacherRosterImportService,
            ICurrentUserService currentUserService)
        {
            _teacherClassService = teacherClassService;
            _teacherRosterImportService = teacherRosterImportService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyCollection<TeacherClassSummaryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyCollection<TeacherClassSummaryDto>>> GetClasses(
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.GetClassesAsync(teacherUserId, cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        [ProducesResponseType(typeof(TeacherClassSummaryDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<TeacherClassSummaryDto>> CreateClass(
            [FromBody] CreateTeacherClassRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.CreateClassAsync(teacherUserId, request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("{classId:guid}")]
        [ProducesResponseType(typeof(TeacherClassDetailDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<TeacherClassDetailDto>> GetClass(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.GetClassAsync(teacherUserId, classId, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{classId:guid}")]
        [ProducesResponseType(typeof(TeacherClassSummaryDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<TeacherClassSummaryDto>> UpdateClass(
            Guid classId,
            [FromBody] UpdateTeacherClassRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.UpdateClassAsync(teacherUserId, classId, request, cancellationToken);
            return Ok(response);
        }

        [HttpDelete("{classId:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> DeleteClass(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            await _teacherClassService.DeleteClassAsync(teacherUserId, classId, cancellationToken);
            return NoContent();
        }

        [HttpPost("{classId:guid}/roster-imports")]
        [ProducesResponseType(typeof(StudentImportBatchDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<StudentImportBatchDto>> ImportRoster(
            Guid classId,
            [FromBody] ImportStudentRosterRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherRosterImportService.ImportStudentsAsync(
                teacherUserId,
                classId,
                request,
                cancellationToken);

            return Ok(response);
        }

        private string GetRequiredUserId()
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            return _currentUserService.UserId;
        }
    }
}
