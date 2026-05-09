using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.QuestionBank;
using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Server.Contracts;
using examxy.Server.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    [ApiController]
    [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
    [Route("api/question-bank/questions")]
    public sealed class QuestionBankController : ControllerBase
    {
        private readonly IQuestionBankService _questionBankService;
        private readonly ICurrentUserService _currentUserService;

        public QuestionBankController(
            IQuestionBankService questionBankService,
            ICurrentUserService currentUserService)
        {
            _questionBankService = questionBankService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyCollection<QuestionDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IReadOnlyCollection<QuestionDto>>> GetQuestions(
            [FromQuery] string? query,
            [FromQuery] string? status,
            [FromQuery] string? type,
            [FromQuery] string? difficulty,
            [FromQuery] string? tag,
            [FromQuery] bool? hasMath,
            [FromQuery] bool? hasMedia,
            [FromQuery] bool? hasGraph,
            [FromQuery] int? schemaVersion,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var hasFilters =
                !string.IsNullOrWhiteSpace(query) ||
                !string.IsNullOrWhiteSpace(status) ||
                !string.IsNullOrWhiteSpace(type) ||
                !string.IsNullOrWhiteSpace(difficulty) ||
                !string.IsNullOrWhiteSpace(tag) ||
                hasMath.HasValue ||
                hasMedia.HasValue ||
                hasGraph.HasValue ||
                schemaVersion.HasValue;
            var response = hasFilters
                ? (await _questionBankService.SearchQuestionsAsync(
                    teacherUserId,
                    new QuestionBankQueryDto
                    {
                        Query = query ?? string.Empty,
                        Status = status ?? string.Empty,
                        Type = type ?? string.Empty,
                        Difficulty = difficulty ?? string.Empty,
                        Tag = tag ?? string.Empty,
                        HasMath = hasMath,
                        HasMedia = hasMedia,
                        HasGraph = hasGraph,
                        SchemaVersion = schemaVersion,
                        Page = 1,
                        PageSize = 100
                    },
                    cancellationToken)).Items
                : await _questionBankService.GetQuestionsAsync(
                    teacherUserId,
                    cancellationToken);
            return Ok(response);
        }

        [HttpGet("search")]
        [ProducesResponseType(typeof(QuestionBankPagedResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<QuestionBankPagedResultDto>> SearchQuestions(
            [FromQuery] QuestionBankQueryDto query,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.SearchQuestionsAsync(
                teacherUserId,
                query,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("/api/question-bank/capabilities")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(QuestionBankCapabilitiesDto), StatusCodes.Status200OK)]
        public ActionResult<QuestionBankCapabilitiesDto> GetCapabilities()
        {
            return Ok(_questionBankService.GetCapabilities());
        }

        [HttpPost]
        [ProducesResponseType(typeof(QuestionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<QuestionDto>> CreateQuestion(
            [FromBody] CreateQuestionRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.CreateQuestionAsync(
                teacherUserId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("{questionId:guid}")]
        [ProducesResponseType(typeof(QuestionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuestionDto>> GetQuestion(
            Guid questionId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.GetQuestionAsync(
                teacherUserId,
                questionId,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("{questionId:guid}/versions")]
        [ProducesResponseType(typeof(IReadOnlyCollection<QuestionVersionDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IReadOnlyCollection<QuestionVersionDto>>> GetQuestionVersions(
            Guid questionId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.GetQuestionVersionsAsync(
                teacherUserId,
                questionId,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("{questionId:guid}/versions/{versionNumber:int}")]
        [ProducesResponseType(typeof(QuestionVersionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuestionVersionDto>> GetQuestionVersion(
            Guid questionId,
            int versionNumber,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.GetQuestionVersionAsync(
                teacherUserId,
                questionId,
                versionNumber,
                cancellationToken);
            return Ok(response);
        }

        [HttpPut("{questionId:guid}")]
        [ProducesResponseType(typeof(QuestionDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuestionDto>> UpdateQuestion(
            Guid questionId,
            [FromBody] UpdateQuestionRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.UpdateQuestionAsync(
                teacherUserId,
                questionId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpDelete("{questionId:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteQuestion(
            Guid questionId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            await _questionBankService.DeleteQuestionAsync(
                teacherUserId,
                questionId,
                cancellationToken);
            return NoContent();
        }

        [HttpPost("preview/latex")]
        [ProducesResponseType(typeof(PreviewLatexResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<PreviewLatexResponseDto>> PreviewLatex(
            [FromBody] PreviewLatexRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.PreviewLatexAsync(
                teacherUserId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("import/preview")]
        [ProducesResponseType(typeof(PreviewQuestionImportResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<PreviewQuestionImportResponseDto>> PreviewQuestionImport(
            [FromBody] PreviewQuestionImportRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.PreviewQuestionImportAsync(
                teacherUserId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("/api/question-bank/exports/pdf")]
        [ProducesResponseType(typeof(QuestionBankExportJobDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<QuestionBankExportJobDto>> CreatePdfExport(
            [FromBody] CreateQuestionBankExportRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.CreatePdfExportAsync(
                teacherUserId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("/api/question-bank/exports/{exportJobId:guid}")]
        [ProducesResponseType(typeof(QuestionBankExportJobDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuestionBankExportJobDto>> GetPdfExport(
            Guid exportJobId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.GetExportJobAsync(
                teacherUserId,
                exportJobId,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("/api/question-bank/exports/{exportJobId:guid}/files/{fileId:guid}/download")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DownloadPdfExportFile(
            Guid exportJobId,
            Guid fileId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var file = await _questionBankService.OpenExportFileAsync(
                teacherUserId,
                exportJobId,
                fileId,
                cancellationToken);
            return File(file.Content, file.ContentType, file.FileName);
        }

        [HttpPost("/api/question-bank/attachments/upload-url")]
        [ProducesResponseType(typeof(CreateQuestionBankAttachmentUploadUrlResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<CreateQuestionBankAttachmentUploadUrlResponseDto>> CreateAttachmentUploadUrl(
            [FromBody] CreateQuestionBankAttachmentUploadUrlRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.CreateAttachmentUploadUrlAsync(
                teacherUserId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("/api/question-bank/attachments/complete")]
        [ProducesResponseType(typeof(QuestionAttachmentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<QuestionAttachmentDto>> CompleteAttachmentUpload(
            [FromBody] CompleteQuestionBankAttachmentUploadRequestDto request,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.CompleteAttachmentUploadAsync(
                teacherUserId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("/api/question-bank/attachments/{attachmentId:guid}")]
        [ProducesResponseType(typeof(QuestionAttachmentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<QuestionAttachmentDto>> GetAttachment(
            Guid attachmentId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.GetAttachmentAsync(
                teacherUserId,
                attachmentId,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("/api/question-bank/attachments/{attachmentId:guid}/download")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> DownloadAttachment(
            Guid attachmentId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var file = await _questionBankService.OpenAttachmentAsync(
                teacherUserId,
                attachmentId,
                cancellationToken);
            return File(file.Content, file.ContentType, file.FileName);
        }

        [HttpDelete("/api/question-bank/attachments/{attachmentId:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteAttachment(
            Guid attachmentId,
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            await _questionBankService.DeleteAttachmentAsync(
                teacherUserId,
                attachmentId,
                cancellationToken);
            return NoContent();
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
