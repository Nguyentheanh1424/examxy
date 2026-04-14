using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.Assessments;
using examxy.Application.Features.Assessments.DTOs;
using examxy.Server.Contracts;
using examxy.Server.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/classes/{classId:guid}/assessments")]
    public sealed class ClassAssessmentsController : ControllerBase
    {
        private readonly IClassAssessmentService _classAssessmentService;
        private readonly ICurrentUserService _currentUserService;

        public ClassAssessmentsController(
            IClassAssessmentService classAssessmentService,
            ICurrentUserService currentUserService)
        {
            _classAssessmentService = classAssessmentService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyCollection<AssessmentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IReadOnlyCollection<AssessmentDto>>> GetAssessments(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classAssessmentService.GetClassAssessmentsAsync(
                userId,
                classId,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(typeof(AssessmentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AssessmentDto>> CreateAssessment(
            Guid classId,
            [FromBody] CreateAssessmentRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _classAssessmentService.CreateAssessmentAsync(
                teacherUserId,
                classId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPut("{assessmentId:guid}")]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(typeof(AssessmentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AssessmentDto>> UpdateAssessment(
            Guid classId,
            Guid assessmentId,
            [FromBody] UpdateAssessmentRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _classAssessmentService.UpdateAssessmentAsync(
                teacherUserId,
                classId,
                assessmentId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("{assessmentId:guid}/publish")]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(typeof(AssessmentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AssessmentDto>> PublishAssessment(
            Guid classId,
            Guid assessmentId,
            [FromBody] PublishAssessmentRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _classAssessmentService.PublishAssessmentAsync(
                teacherUserId,
                classId,
                assessmentId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("{assessmentId:guid}/attempts")]
        [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
        [ProducesResponseType(typeof(StudentAssessmentAttemptDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<StudentAssessmentAttemptDto>> StartAttempt(
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classAssessmentService.StartAttemptAsync(
                userId,
                classId,
                assessmentId,
                cancellationToken);
            return Ok(response);
        }

        [HttpPut("attempts/{attemptId:guid}/answers")]
        [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
        [ProducesResponseType(typeof(StudentAssessmentAttemptDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<StudentAssessmentAttemptDto>> SaveAnswers(
            Guid classId,
            Guid attemptId,
            [FromBody] SaveAttemptAnswersRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classAssessmentService.SaveAnswersAsync(
                userId,
                classId,
                attemptId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("attempts/{attemptId:guid}/submit")]
        [Authorize(Policy = AuthorizationPolicies.StudentOnly)]
        [ProducesResponseType(typeof(StudentAssessmentAttemptDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<StudentAssessmentAttemptDto>> SubmitAttempt(
            Guid classId,
            Guid attemptId,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classAssessmentService.SubmitAttemptAsync(
                userId,
                classId,
                attemptId,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("{assessmentId:guid}/results")]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(typeof(IReadOnlyCollection<StudentAssessmentAttemptDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IReadOnlyCollection<StudentAssessmentAttemptDto>>> GetResults(
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _classAssessmentService.GetAssessmentResultsAsync(
                teacherUserId,
                classId,
                assessmentId,
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
