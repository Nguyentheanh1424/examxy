using examxy.Application.Exceptions;
using examxy.Application.Features.Notifications;
using examxy.Application.Features.Notifications.DTOs;
using examxy.Application.Features.Realtime;
using examxy.Application.Features.Realtime.DTOs;
using examxy.Domain.Notifications.Enums;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Features.Notifications
{
    public sealed class NotificationInboxService : INotificationInboxService
    {
        private const int DefaultLimit = 50;
        private const int MaxLimit = 100;

        private readonly AppDbContext _dbContext;
        private readonly IRealtimeEventPublisher _realtimeEventPublisher;

        public NotificationInboxService(
            AppDbContext dbContext,
            IRealtimeEventPublisher realtimeEventPublisher)
        {
            _dbContext = dbContext;
            _realtimeEventPublisher = realtimeEventPublisher;
        }

        public async Task<NotificationInboxListDto> GetNotificationsAsync(
            string userId,
            bool onlyUnread,
            int limit,
            Guid? classId,
            string? scope,
            string? sourceType,
            string? notificationType,
            CancellationToken cancellationToken = default)
        {
            var normalizedLimit = NormalizeLimit(limit);
            var query = ApplyFilters(
                _dbContext.UserNotifications.Where(notification => notification.RecipientUserId == userId),
                classId,
                scope,
                sourceType,
                notificationType);

            if (onlyUnread)
            {
                query = query.Where(notification => !notification.IsRead);
            }

            var unreadCount = await CountUnreadAsync(userId, null, null, null, null, cancellationToken);
            var items = await query
                .OrderByDescending(notification => notification.CreatedAtUtc)
                .Take(normalizedLimit)
                .ToArrayAsync(cancellationToken);

            return new NotificationInboxListDto
            {
                UnreadCount = unreadCount,
                Items = items.Select(NotificationLinkResolver.Map).ToArray()
            };
        }

        public async Task<MarkNotificationsReadResultDto> MarkNotificationAsReadAsync(
            string userId,
            Guid notificationId,
            CancellationToken cancellationToken = default)
        {
            var notification = await _dbContext.UserNotifications
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == notificationId &&
                        candidate.RecipientUserId == userId,
                    cancellationToken);

            if (notification is null)
            {
                throw new NotFoundException("Notification not found.");
            }

            var updatedCount = 0;
            if (!notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAtUtc = DateTime.UtcNow;
                updatedCount = 1;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            var unreadCount = await CountUnreadAsync(userId, null, null, null, null, cancellationToken);

            if (updatedCount > 0)
            {
                await _realtimeEventPublisher.PublishToUserAsync(
                    userId,
                    RealtimeEventTypes.Notification.Read,
                    userId,
                    new NotificationReadRealtimePayloadDto
                    {
                        NotificationIds = new[] { notificationId },
                        UnreadCount = unreadCount,
                        ClassId = notification.ClassId
                    },
                    cancellationToken);
            }

            return new MarkNotificationsReadResultDto
            {
                UpdatedCount = updatedCount,
                UnreadCount = unreadCount
            };
        }

        public async Task<MarkNotificationsReadResultDto> MarkAllNotificationsAsReadAsync(
            string userId,
            Guid? classId,
            string? scope,
            string? sourceType,
            string? notificationType,
            CancellationToken cancellationToken = default)
        {
            var notifications = await ApplyFilters(
                    _dbContext.UserNotifications.Where(notification => notification.RecipientUserId == userId),
                    classId,
                    scope,
                    sourceType,
                    notificationType)
                .Where(notification => !notification.IsRead)
                .ToArrayAsync(cancellationToken);

            if (notifications.Length > 0)
            {
                var now = DateTime.UtcNow;
                foreach (var notification in notifications)
                {
                    notification.IsRead = true;
                    notification.ReadAtUtc = now;
                }

                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            var unreadCount = await CountUnreadAsync(userId, null, null, null, null, cancellationToken);

            if (notifications.Length > 0)
            {
                await _realtimeEventPublisher.PublishToUserAsync(
                    userId,
                    RealtimeEventTypes.Notification.Read,
                    userId,
                    new NotificationReadRealtimePayloadDto
                    {
                        NotificationIds = notifications.Select(notification => notification.Id).ToArray(),
                        UnreadCount = unreadCount,
                        ClassId = classId
                    },
                    cancellationToken);
            }

            return new MarkNotificationsReadResultDto
            {
                UpdatedCount = notifications.Length,
                UnreadCount = unreadCount
            };
        }

        private IQueryable<Domain.Notifications.UserNotification> ApplyFilters(
            IQueryable<Domain.Notifications.UserNotification> query,
            Guid? classId,
            string? scope,
            string? sourceType,
            string? notificationType)
        {
            if (classId.HasValue)
            {
                query = query.Where(notification => notification.ClassId == classId.Value);
            }

            if (!string.IsNullOrWhiteSpace(scope))
            {
                query = scope.Trim().ToLowerInvariant() switch
                {
                    "class" => query.Where(notification => notification.ClassId.HasValue),
                    "account" => query.Where(notification => !notification.ClassId.HasValue),
                    _ => throw new ValidationException(
                        "Notification scope is invalid.",
                        new Dictionary<string, string[]>
                        {
                            ["scope"] = new[] { "Scope must be class or account." }
                        })
                };
            }

            if (!string.IsNullOrWhiteSpace(sourceType))
            {
                if (!Enum.TryParse<NotificationSourceType>(sourceType, true, out var parsedSourceType))
                {
                    throw new ValidationException(
                        "Notification source type is invalid.",
                        new Dictionary<string, string[]>
                        {
                            ["sourceType"] = new[] { "SourceType must be Post, Comment, or Assessment." }
                        });
                }

                query = query.Where(notification => notification.SourceType == parsedSourceType);
            }

            if (!string.IsNullOrWhiteSpace(notificationType))
            {
                if (!Enum.TryParse<NotificationType>(notificationType, true, out var parsedNotificationType))
                {
                    throw new ValidationException(
                        "Notification type is invalid.",
                        new Dictionary<string, string[]>
                        {
                            ["notificationType"] = new[] { "NotificationType is not supported." }
                        });
                }

                query = query.Where(notification => notification.NotificationType == parsedNotificationType);
            }

            return query;
        }

        private Task<int> CountUnreadAsync(
            string userId,
            Guid? classId,
            string? scope,
            string? sourceType,
            string? notificationType,
            CancellationToken cancellationToken)
        {
            return ApplyFilters(
                    _dbContext.UserNotifications.Where(notification => notification.RecipientUserId == userId),
                    classId,
                    scope,
                    sourceType,
                    notificationType)
                .CountAsync(notification => !notification.IsRead, cancellationToken);
        }

        private static int NormalizeLimit(int limit)
        {
            if (limit <= 0)
            {
                return DefaultLimit;
            }

            return Math.Min(limit, MaxLimit);
        }
    }
}
