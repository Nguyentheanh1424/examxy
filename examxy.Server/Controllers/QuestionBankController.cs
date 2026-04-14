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
            CancellationToken cancellationToken)
        {
            var teacherUserId = GetRequiredUserId();
            var response = await _questionBankService.GetQuestionsAsync(
                teacherUserId,
                cancellationToken);
            return Ok(response);
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
