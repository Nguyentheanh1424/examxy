using examxy.Application.Features.Notifications.DTOs;

namespace examxy.Application.Features.Notifications
{
    public interface INotificationInboxService
    {
        Task<NotificationInboxListDto> GetNotificationsAsync(
            string userId,
            bool onlyUnread,
            int limit,
            Guid? classId,
            string? scope,
            string? sourceType,
            string? notificationType,
            CancellationToken cancellationToken = default);

        Task<MarkNotificationsReadResultDto> MarkNotificationAsReadAsync(
            string userId,
            Guid notificationId,
            CancellationToken cancellationToken = default);

        Task<MarkNotificationsReadResultDto> MarkAllNotificationsAsReadAsync(
            string userId,
            Guid? classId,
            string? scope,
            string? sourceType,
            string? notificationType,
            CancellationToken cancellationToken = default);
    }
}
