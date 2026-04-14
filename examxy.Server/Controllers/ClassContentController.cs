using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.ClassContent;
using examxy.Application.Features.ClassContent.DTOs;
using examxy.Server.Contracts;
using examxy.Server.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/classes/{classId:guid}")]
    public sealed class ClassContentController : ControllerBase
    {
        private readonly IClassContentService _classContentService;
        private readonly ICurrentUserService _currentUserService;

        public ClassContentController(
            IClassContentService classContentService,
            ICurrentUserService currentUserService)
        {
            _classContentService = classContentService;
            _currentUserService = currentUserService;
        }

        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(ClassDashboardDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassDashboardDto>> GetDashboard(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.GetClassDashboardAsync(
                userId,
                classId,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("feed")]
        [ProducesResponseType(typeof(IReadOnlyCollection<ClassFeedItemDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IReadOnlyCollection<ClassFeedItemDto>>> GetFeed(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.GetFeedAsync(
                userId,
                classId,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("posts")]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(typeof(ClassPostDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassPostDto>> CreatePost(
            Guid classId,
            [FromBody] CreateClassPostRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.CreatePostAsync(
                userId,
                classId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPut("posts/{postId:guid}")]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(typeof(ClassPostDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassPostDto>> UpdatePost(
            Guid classId,
            Guid postId,
            [FromBody] UpdateClassPostRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.UpdatePostAsync(
                userId,
                classId,
                postId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("posts/{postId:guid}/comments")]
        [ProducesResponseType(typeof(ClassCommentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassCommentDto>> CreateComment(
            Guid classId,
            Guid postId,
            [FromBody] CreateClassCommentRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.CreateCommentAsync(
                userId,
                classId,
                postId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPut("comments/{commentId:guid}")]
        [ProducesResponseType(typeof(ClassCommentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassCommentDto>> UpdateComment(
            Guid classId,
            Guid commentId,
            [FromBody] UpdateClassCommentRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.UpdateCommentAsync(
                userId,
                classId,
                commentId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpDelete("comments/{commentId:guid}")]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> HideComment(
            Guid classId,
            Guid commentId,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            await _classContentService.HideCommentAsync(
                userId,
                classId,
                commentId,
                cancellationToken);
            return NoContent();
        }

        [HttpPut("posts/{postId:guid}/reaction")]
        [ProducesResponseType(typeof(ClassReactionSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassReactionSummaryDto>> SetPostReaction(
            Guid classId,
            Guid postId,
            [FromBody] SetReactionRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.SetPostReactionAsync(
                userId,
                classId,
                postId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPut("comments/{commentId:guid}/reaction")]
        [ProducesResponseType(typeof(ClassReactionSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassReactionSummaryDto>> SetCommentReaction(
            Guid classId,
            Guid commentId,
            [FromBody] SetReactionRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.SetCommentReactionAsync(
                userId,
                classId,
                commentId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpGet("schedule-items")]
        [ProducesResponseType(typeof(IReadOnlyCollection<ClassScheduleItemDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IReadOnlyCollection<ClassScheduleItemDto>>> GetScheduleItems(
            Guid classId,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.GetScheduleItemsAsync(
                userId,
                classId,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("schedule-items")]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(typeof(ClassScheduleItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassScheduleItemDto>> CreateScheduleItem(
            Guid classId,
            [FromBody] CreateClassScheduleItemRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.CreateScheduleItemAsync(
                userId,
                classId,
                request,
                cancellationToken);
            return Ok(response);
        }

        [HttpPut("schedule-items/{scheduleItemId:guid}")]
        [Authorize(Policy = AuthorizationPolicies.TeacherOnly)]
        [ProducesResponseType(typeof(ClassScheduleItemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ClassScheduleItemDto>> UpdateScheduleItem(
            Guid classId,
            Guid scheduleItemId,
            [FromBody] UpdateClassScheduleItemRequestDto request,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _classContentService.UpdateScheduleItemAsync(
                userId,
                classId,
                scheduleItemId,
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
