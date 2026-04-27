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
    [Route("api/paper-exam/templates")]
    public sealed class PaperExamTemplatesController : ControllerBase
    {
        private readonly IPaperExamTemplateService _paperExamTemplateService;
        private readonly ICurrentUserService _currentUserService;

        public PaperExamTemplatesController(
            IPaperExamTemplateService paperExamTemplateService,
            ICurrentUserService currentUserService)
        {
            _paperExamTemplateService = paperExamTemplateService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyCollection<PaperExamTemplateDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyCollection<PaperExamTemplateDto>>> GetTemplates(CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.GetTemplatesAsync(cancellationToken);
            return Ok(response);
        }

        [HttpPost]
        [ProducesResponseType(typeof(PaperExamTemplateDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaperExamTemplateDto>> CreateTemplate(
            [FromBody] CreatePaperExamTemplateRequestDto request,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.CreateTemplateAsync(request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("{templateId:guid}")]
        [ProducesResponseType(typeof(PaperExamTemplateDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaperExamTemplateDto>> GetTemplate(Guid templateId, CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.GetTemplateAsync(templateId, cancellationToken);
            return Ok(response);
        }

        [HttpPost("{templateId:guid}/versions")]
        [ProducesResponseType(typeof(PaperExamTemplateVersionDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaperExamTemplateVersionDto>> CreateVersion(
            Guid templateId,
            [FromBody] CreatePaperExamTemplateVersionRequestDto request,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.CreateTemplateVersionAsync(templateId, request, cancellationToken);
            return Ok(response);
        }

        [HttpGet("{templateId:guid}/versions/{versionId:guid}")]
        [ProducesResponseType(typeof(PaperExamTemplateVersionDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaperExamTemplateVersionDto>> GetVersion(
            Guid templateId,
            Guid versionId,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.GetTemplateVersionAsync(templateId, versionId, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{templateId:guid}/versions/{versionId:guid}")]
        [ProducesResponseType(typeof(PaperExamTemplateVersionDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaperExamTemplateVersionDto>> UpdateVersion(
            Guid templateId,
            Guid versionId,
            [FromBody] UpdatePaperExamTemplateVersionRequestDto request,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.UpdateTemplateVersionAsync(templateId, versionId, request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("{templateId:guid}/versions/{versionId:guid}/assets")]
        [ProducesResponseType(typeof(PaperExamTemplateAssetDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaperExamTemplateAssetDto>> UploadAsset(
            Guid templateId,
            Guid versionId,
            [FromBody] UploadPaperExamTemplateAssetRequestDto request,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.UploadTemplateAssetAsync(templateId, versionId, request, cancellationToken);
            return Ok(response);
        }

        [HttpPut("{templateId:guid}/versions/{versionId:guid}/metadata-fields")]
        [ProducesResponseType(typeof(IReadOnlyCollection<PaperExamMetadataFieldDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyCollection<PaperExamMetadataFieldDto>>> UpsertMetadataFields(
            Guid templateId,
            Guid versionId,
            [FromBody] IReadOnlyCollection<UpsertPaperExamMetadataFieldRequestDto> request,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.UpsertMetadataFieldsAsync(templateId, versionId, request, cancellationToken);
            return Ok(response);
        }

        [HttpPost("{templateId:guid}/versions/{versionId:guid}/validate")]
        [ProducesResponseType(typeof(ValidatePaperExamTemplateVersionResultDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<ValidatePaperExamTemplateVersionResultDto>> ValidateVersion(
            Guid templateId,
            Guid versionId,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.ValidateTemplateVersionAsync(templateId, versionId, cancellationToken);
            return Ok(response);
        }

        [HttpPost("{templateId:guid}/versions/{versionId:guid}/publish")]
        [ProducesResponseType(typeof(PaperExamTemplateVersionDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaperExamTemplateVersionDto>> PublishVersion(
            Guid templateId,
            Guid versionId,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.PublishTemplateVersionAsync(templateId, versionId, cancellationToken);
            return Ok(response);
        }

        [HttpPost("{templateId:guid}/versions/{versionId:guid}/clone")]
        [ProducesResponseType(typeof(PaperExamTemplateVersionDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PaperExamTemplateVersionDto>> CloneVersion(
            Guid templateId,
            Guid versionId,
            CancellationToken cancellationToken)
        {
            EnsureTeacherOrAdmin();
            var response = await _paperExamTemplateService.CloneTemplateVersionAsync(templateId, versionId, cancellationToken);
            return Ok(response);
        }

        private void EnsureTeacherOrAdmin()
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            if (_currentUserService.IsInRole(IdentityRoles.Teacher) || _currentUserService.IsInRole(IdentityRoles.Admin))
            {
                return;
            }

            throw new ForbiddenException("Teacher or admin role is required.");
        }
    }
}
