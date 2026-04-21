using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.Notifications;
using examxy.Application.Features.Notifications.DTOs;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/notifications")]
    public sealed class NotificationsController : ControllerBase
    {
        private readonly INotificationInboxService _notificationInboxService;
        private readonly ICurrentUserService _currentUserService;

        public NotificationsController(
            INotificationInboxService notificationInboxService,
            ICurrentUserService currentUserService)
        {
            _notificationInboxService = notificationInboxService;
            _currentUserService = currentUserService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(NotificationInboxListDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<NotificationInboxListDto>> GetNotifications(
            [FromQuery] bool onlyUnread = false,
            [FromQuery] int limit = 50,
            [FromQuery] Guid? classId = null,
            [FromQuery] string? scope = null,
            [FromQuery] string? sourceType = null,
            [FromQuery] string? notificationType = null,
            CancellationToken cancellationToken = default)
        {
            var userId = GetRequiredUserId();
            var response = await _notificationInboxService.GetNotificationsAsync(
                userId,
                onlyUnread,
                limit,
                classId,
                scope,
                sourceType,
                notificationType,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("{notificationId:guid}/read")]
        [ProducesResponseType(typeof(MarkNotificationsReadResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<MarkNotificationsReadResultDto>> MarkNotificationAsRead(
            Guid notificationId,
            CancellationToken cancellationToken)
        {
            var userId = GetRequiredUserId();
            var response = await _notificationInboxService.MarkNotificationAsReadAsync(
                userId,
                notificationId,
                cancellationToken);
            return Ok(response);
        }

        [HttpPost("read-all")]
        [ProducesResponseType(typeof(MarkNotificationsReadResultDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<MarkNotificationsReadResultDto>> MarkAllNotificationsAsRead(
            [FromQuery] Guid? classId = null,
            [FromQuery] string? scope = null,
            [FromQuery] string? sourceType = null,
            [FromQuery] string? notificationType = null,
            CancellationToken cancellationToken = default)
        {
            var userId = GetRequiredUserId();
            var response = await _notificationInboxService.MarkAllNotificationsAsReadAsync(
                userId,
                classId,
                scope,
                sourceType,
                notificationType,
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
