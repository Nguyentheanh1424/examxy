using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.PaperExams;
using examxy.Application.Features.PaperExams.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/classes/{classId:guid}/assessments/{assessmentId:guid}/paper-binding")]
    public sealed class AssessmentPaperBindingsController : ControllerBase
    {
        private readonly IPaperExamTemplateService _paperExamTemplateService;
        private readonly ICurrentUserService _currentUserService;

        public AssessmentPaperBindingsController(
            IPaperExamTemplateService paperExamTemplateService,
            ICurrentUserService currentUserService)
        {
            _paperExamTemplateService = paperExamTemplateService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(AssessmentPaperBindingDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AssessmentPaperBindingDto>> GetBinding(
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            var response = await _paperExamTemplateService.GetAssessmentBindingAsync(
                EnsureTeacherAuthenticated(),
                classId,
                assessmentId,
                cancellationToken);
            if (response is null)
            {
                return NotFound();
            }

            return Ok(response);
        }

        [HttpPost]
        [ProducesResponseType(typeof(AssessmentPaperBindingDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AssessmentPaperBindingDto>> UpsertBinding(
            Guid classId,
            Guid assessmentId,
            [FromBody] UpsertAssessmentPaperBindingRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _paperExamTemplateService.UpsertAssessmentBindingAsync(
                EnsureTeacherAuthenticated(),
                classId,
                assessmentId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPut]
        [ProducesResponseType(typeof(AssessmentPaperBindingDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AssessmentPaperBindingDto>> UpdateBinding(
            Guid classId,
            Guid assessmentId,
            [FromBody] UpsertAssessmentPaperBindingRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _paperExamTemplateService.UpsertAssessmentBindingAsync(
                EnsureTeacherAuthenticated(),
                classId,
                assessmentId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("activate")]
        [ProducesResponseType(typeof(AssessmentPaperBindingDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<AssessmentPaperBindingDto>> ActivateBinding(
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken)
        {
            var response = await _paperExamTemplateService.ActivateAssessmentBindingAsync(
                EnsureTeacherAuthenticated(),
                classId,
                assessmentId,
                cancellationToken);
            return Ok(response);
        }

        private string EnsureTeacherAuthenticated()
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            if (!_currentUserService.IsInRole(IdentityRoles.Teacher))
            {
                throw new ForbiddenException("Teacher role is required.");
            }

            return _currentUserService.UserId;
        }
    }
}
