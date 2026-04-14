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
    /// Teacher-only APIs for class lifecycle management and roster imports.
    /// </summary>
    /// <remarks>
    /// These endpoints back the teacher dashboard and class detail flows.
    /// A teacher creates a class first, then imports a roster, then monitors memberships and pending invites.
    /// </remarks>
    [ApiController]
    [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
    [Route("api/classes")]
    public sealed class TeacherClassesController : ControllerBase
    {
        private readonly ITeacherClassService _teacherClassService;
        private readonly ITeacherRosterImportService _teacherRosterImportService;
        private readonly IRosterImportFileParser _rosterImportFileParser;
        private readonly ICurrentUserService _currentUserService;

        public TeacherClassesController(
            ITeacherClassService teacherClassService,
            ITeacherRosterImportService teacherRosterImportService,
            IRosterImportFileParser rosterImportFileParser,
            ICurrentUserService currentUserService)
        {
            _teacherClassService = teacherClassService;
            _teacherRosterImportService = teacherRosterImportService;
            _rosterImportFileParser = rosterImportFileParser;
            _currentUserService = currentUserService;
        }

        /// <summary>
        /// List the classes owned by the authenticated teacher.
        /// </summary>
        /// <remarks>
        /// This is the main teacher dashboard entrypoint.
        /// The response includes per-class counters that help the UI summarize active students and pending invites.
        /// </remarks>
        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyCollection<TeacherClassSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IReadOnlyCollection<TeacherClassSummaryDto>>> GetClasses(
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.GetClassesAsync(teacherUserId, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Create a new class owned by the authenticated teacher.
        /// </summary>
        /// <remarks>
        /// Flow: teacher chooses a class name and optional code -&gt; the class is created under the current teacher
        /// -&gt; the client can immediately continue into class detail or roster import.
        /// </remarks>
        [HttpPost]
        [ProducesResponseType(typeof(TeacherClassSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<TeacherClassSummaryDto>> CreateClass(
            [FromBody] CreateTeacherClassRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.CreateClassAsync(teacherUserId, request, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Return class detail, memberships, invites, and import batches for one teacher-owned class.
        /// </summary>
        /// <remarks>
        /// This endpoint powers the class detail view after a teacher selects a class from the dashboard.
        /// Teachers can only access classes they own; classes owned by another teacher return <c>404</c>.
        /// </remarks>
        [HttpGet("{classId:guid}")]
        [ProducesResponseType(typeof(TeacherClassDetailDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<TeacherClassDetailDto>> GetClass(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.GetClassAsync(teacherUserId, classId, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Update the name, code, or status of a teacher-owned class.
        /// </summary>
        /// <remarks>
        /// Use this endpoint to keep class metadata in sync after creation.
        /// Ownership is enforced; classes outside the current teacher's scope are treated as not found.
        /// </remarks>
        [HttpPut("{classId:guid}")]
        [ProducesResponseType(typeof(TeacherClassSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<TeacherClassSummaryDto>> UpdateClass(
            Guid classId,
            [FromBody] UpdateTeacherClassRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.UpdateClassAsync(teacherUserId, classId, request, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Delete a teacher-owned class.
        /// </summary>
        /// <remarks>
        /// This removes the class from the teacher's workspace.
        /// The endpoint only succeeds for classes owned by the current teacher.
        /// </remarks>
        [HttpDelete("{classId:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteClass(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            await _teacherClassService.DeleteClassAsync(teacherUserId, classId, cancellationToken);
            return NoContent();
        }

        /// <summary>
        /// Remove one student membership record from a teacher-owned class.
        /// </summary>
        /// <remarks>
        /// This permanently deletes the membership record for the selected student in the selected class.
        /// </remarks>
        [HttpDelete("{classId:guid}/memberships/{membershipId:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteMembership(
            Guid classId,
            Guid membershipId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            await _teacherClassService.DeleteMembershipAsync(
                teacherUserId,
                classId,
                membershipId,
                cancellationToken);

            return NoContent();
        }

        /// <summary>
        /// Resend a class invite for a teacher-owned class invite entry.
        /// </summary>
        /// <remarks>
        /// This creates a new pending invite with a new invite code and sends a fresh invite email.
        /// Pending invites for the same class/email are cancelled before the new invite is issued.
        /// </remarks>
        [HttpPost("{classId:guid}/invites/{inviteId:guid}/resend")]
        [ProducesResponseType(typeof(ClassInviteDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ClassInviteDto>> ResendInvite(
            Guid classId,
            Guid inviteId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.ResendInviteAsync(
                teacherUserId,
                classId,
                inviteId,
                cancellationToken);

            return Ok(response);
        }

        /// <summary>
        /// Cancel a class invite for a teacher-owned class invite entry.
        /// </summary>
        /// <remarks>
        /// This marks the selected invite as cancelled. Used or already-cancelled invites return conflict.
        /// </remarks>
        [HttpPost("{classId:guid}/invites/{inviteId:guid}/cancel")]
        [ProducesResponseType(typeof(ClassInviteDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<ClassInviteDto>> CancelInvite(
            Guid classId,
            Guid inviteId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherClassService.CancelInviteAsync(
                teacherUserId,
                classId,
                inviteId,
                cancellationToken);

            return Ok(response);
        }

        /// <summary>
        /// Add one student to a class by email.
        /// </summary>
        /// <remarks>
        /// This is the single-student flow for teacher class management.
        /// </remarks>
        [HttpPost("{classId:guid}/students")]
        [ProducesResponseType(typeof(StudentImportItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<StudentImportItemDto>> AddStudentByEmail(
            Guid classId,
            [FromBody] AddStudentByEmailRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _teacherRosterImportService.AddStudentByEmailAsync(
                teacherUserId,
                classId,
                request,
                cancellationToken);

            return Ok(response);
        }

        /// <summary>
        /// Import a roster file into a teacher-owned class and dispatch onboarding or invite emails.
        /// </summary>
        /// <remarks>
        /// Flow: teacher uploads a CSV/XLSX roster file -&gt; each row is evaluated -&gt; new student emails create
        /// invited student accounts, existing student emails receive new invites, and wrong-role emails are rejected
        /// in the import batch result. The response summarizes the import outcome row by row.
        /// </remarks>
        [HttpPost("{classId:guid}/roster-imports")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(StudentImportBatchDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<StudentImportBatchDto>> ImportRoster(
            Guid classId,
            IFormFile file,
            CancellationToken cancellationToken)
        {
            if (file is null || file.Length == 0)
            {
                throw new ValidationException(
                    "Roster file is required.",
                    new Dictionary<string, string[]>
                    {
                        ["file"] = new[] { "Please upload a non-empty CSV or XLSX file." }
                    });
            }

            await using var stream = file.OpenReadStream();
            var request = await _rosterImportFileParser.ParseAsync(stream, file.FileName, cancellationToken);

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
