using examxy.Application.Features.Notifications;
using examxy.Application.Features.Realtime;
using examxy.Domain.ClassContent;
using examxy.Domain.Classrooms;
using examxy.Domain.Notifications;
using examxy.Domain.Notifications.Enums;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace examxy.Infrastructure.Features.Notifications
{
    public sealed class NotificationReminderProcessor : INotificationReminderProcessor
    {
        private readonly AppDbContext _dbContext;
        private readonly IRealtimeEventPublisher _realtimeEventPublisher;
        private readonly TimeProvider _timeProvider;
        private readonly NotificationReminderOptions _options;

        public NotificationReminderProcessor(
            AppDbContext dbContext,
            IRealtimeEventPublisher realtimeEventPublisher,
            TimeProvider timeProvider,
            IOptions<NotificationReminderOptions> options)
        {
            _dbContext = dbContext;
            _realtimeEventPublisher = realtimeEventPublisher;
            _timeProvider = timeProvider;
            _options = options.Value;
        }

        public async Task<NotificationReminderProcessingResult> ProcessDueRemindersAsync(
            CancellationToken cancellationToken = default)
        {
            var now = _timeProvider.GetUtcNow().UtcDateTime;
            var result = new NotificationReminderProcessingResult();
            var createdNotifications = new List<UserNotification>();

            foreach (var leadTimeHours in _options.GetLeadTimesHours())
            {
                var leadTime = TimeSpan.FromHours(leadTimeHours);
                var lookback = TimeSpan.FromMinutes(_options.LookbackMinutes);
                var reminderWindowStart = now + leadTime - lookback;
                var reminderWindowEnd = now + leadTime;

                var items = await _dbContext.ClassScheduleItems
                    .Where(item =>
                        item.DeletedAtUtc == null &&
                        item.StartAtUtc > now &&
                        item.StartAtUtc > reminderWindowStart &&
                        item.StartAtUtc <= reminderWindowEnd &&
                        (item.Type == ClassScheduleItemType.Assessment || item.Type == ClassScheduleItemType.Deadline))
                    .OrderBy(item => item.StartAtUtc)
                    .Take(_options.BatchSize)
                    .ToArrayAsync(cancellationToken);

                if (items.Length == 0)
                {
                    continue;
                }

                result.ItemsScanned += items.Length;

                foreach (var item in items)
                {
                    var recipients = await _dbContext.ClassMemberships
                        .Where(membership =>
                            membership.ClassId == item.ClassId &&
                            membership.Status == ClassMembershipStatus.Active)
                        .Select(membership => membership.StudentUserId)
                        .ToArrayAsync(cancellationToken);

                    result.RecipientsEvaluated += recipients.Length;

                    if (recipients.Length == 0)
                    {
                        continue;
                    }

                    var reminderAtUtc = item.StartAtUtc.AddHours(-leadTimeHours);
                    var keys = recipients
                        .Select(recipientUserId => BuildNotificationKey(item.Id, leadTimeHours, reminderAtUtc, recipientUserId))
                        .ToArray();

                    var existingKeys = await _dbContext.UserNotifications
                        .Where(notification => keys.Contains(notification.NotificationKey))
                        .Select(notification => notification.NotificationKey)
                        .ToArrayAsync(cancellationToken);

                    var existingKeySet = new HashSet<string>(existingKeys, StringComparer.Ordinal);
                    var route = NotificationLinkResolver.ForScheduleItem(
                        item.ClassId,
                        item.Id,
                        item.RelatedAssessmentId);

                    foreach (var recipientUserId in recipients)
                    {
                        var key = BuildNotificationKey(item.Id, leadTimeHours, reminderAtUtc, recipientUserId);
                        if (existingKeySet.Contains(key))
                        {
                            result.SkippedExistingCount++;
                            continue;
                        }

                        var notification = new UserNotification
                        {
                            Id = Guid.NewGuid(),
                            ClassId = item.ClassId,
                            RecipientUserId = recipientUserId,
                            ActorUserId = item.CreatorUserId,
                            NotificationType = NotificationType.ScheduleItemReminder24Hours,
                            SourceType = NotificationSourceType.ScheduleItem,
                            SourceId = item.Id,
                            Title = Truncate(item.Title, 200),
                            Message = item.Type == ClassScheduleItemType.Assessment
                                ? $"An assessment is scheduled in {leadTimeHours} hours."
                                : $"A class deadline is due in {leadTimeHours} hours.",
                            LinkPath = route.LinkPath,
                            PayloadJson = route.PayloadJson,
                            NotificationKey = key,
                            IsRead = false,
                            CreatedAtUtc = now
                        };

                        _dbContext.UserNotifications.Add(notification);
                        createdNotifications.Add(notification);
                        result.CreatedCount++;
                    }
                }
            }

            if (createdNotifications.Count == 0)
            {
                return result;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            foreach (var notification in createdNotifications)
            {
                await _realtimeEventPublisher.PublishToUserAsync(
                    notification.RecipientUserId,
                    RealtimeEventTypes.Notification.Created,
                    notification.ActorUserId,
                    NotificationLinkResolver.Map(notification),
                    cancellationToken);
            }

            return result;
        }

        private static string BuildNotificationKey(
            Guid scheduleItemId,
            int leadTimeHours,
            DateTime reminderAtUtc,
            string recipientUserId)
        {
            return $"schedule-reminder:{leadTimeHours}h:{scheduleItemId:N}:{reminderAtUtc:yyyyMMddHHmmss}:{recipientUserId}";
        }

        private static string Truncate(string? value, int maxLength)
        {
            var trimmed = string.IsNullOrWhiteSpace(value)
                ? "Upcoming class schedule"
                : value.Trim();

            return trimmed.Length <= maxLength
                ? trimmed
                : trimmed[..maxLength];
        }
    }
}
