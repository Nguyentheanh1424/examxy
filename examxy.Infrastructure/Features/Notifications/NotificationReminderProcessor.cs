using examxy.Application.Abstractions.Email;
using examxy.Application.Features.Notifications;
using examxy.Application.Features.Realtime;
using examxy.Domain.ClassContent;
using examxy.Domain.Classrooms;
using examxy.Domain.Notifications;
using examxy.Domain.Notifications.Enums;
using examxy.Infrastructure.Email;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace examxy.Infrastructure.Features.Notifications
{
    public sealed class NotificationReminderProcessor : INotificationReminderProcessor
    {
        private readonly AppDbContext _dbContext;
        private readonly IRealtimeEventPublisher _realtimeEventPublisher;
        private readonly IEmailSender _emailSender;
        private readonly TimeProvider _timeProvider;
        private readonly NotificationReminderOptions _options;
        private readonly AppUrlOptions _appUrlOptions;

        public NotificationReminderProcessor(
            AppDbContext dbContext,
            IRealtimeEventPublisher realtimeEventPublisher,
            IEmailSender emailSender,
            TimeProvider timeProvider,
            IOptions<NotificationReminderOptions> options,
            IOptions<AppUrlOptions> appUrlOptions)
        {
            _dbContext = dbContext;
            _realtimeEventPublisher = realtimeEventPublisher;
            _emailSender = emailSender;
            _timeProvider = timeProvider;
            _options = options.Value;
            _appUrlOptions = appUrlOptions.Value;
        }

        public async Task<NotificationReminderProcessingResult> ProcessDueRemindersAsync(
            CancellationToken cancellationToken = default)
        {
            var now = _timeProvider.GetUtcNow().UtcDateTime;
            var result = new NotificationReminderProcessingResult();
            var createdNotifications = new List<UserNotification>();
            var emailMessages = new List<EmailMessage>();

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
                    var recipients = await (
                            from membership in _dbContext.ClassMemberships
                            join user in _dbContext.Users on membership.StudentUserId equals user.Id
                            where membership.ClassId == item.ClassId &&
                                  membership.Status == ClassMembershipStatus.Active
                            select new ReminderRecipient(
                                membership.StudentUserId,
                                user.Email ?? string.Empty))
                        .ToArrayAsync(cancellationToken);

                    result.RecipientsEvaluated += recipients.Length;

                    if (recipients.Length == 0)
                    {
                        continue;
                    }

                    var reminderAtUtc = item.StartAtUtc.AddHours(-leadTimeHours);
                    var keys = recipients
                        .Select(recipient => BuildNotificationKey(item.Id, leadTimeHours, reminderAtUtc, recipient.UserId))
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

                    foreach (var recipient in recipients)
                    {
                        var key = BuildNotificationKey(item.Id, leadTimeHours, reminderAtUtc, recipient.UserId);
                        if (existingKeySet.Contains(key))
                        {
                            result.SkippedExistingCount++;
                            continue;
                        }

                        var notification = new UserNotification
                        {
                            Id = Guid.NewGuid(),
                            ClassId = item.ClassId,
                            RecipientUserId = recipient.UserId,
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
                        QueueReminderEmail(
                            emailMessages,
                            recipient,
                            item,
                            route.LinkPath,
                            leadTimeHours);
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

            foreach (var emailMessage in emailMessages)
            {
                await _emailSender.SendAsync(emailMessage, cancellationToken);
            }

            return result;
        }

        private void QueueReminderEmail(
            ICollection<EmailMessage> emailMessages,
            ReminderRecipient recipient,
            ClassScheduleItem item,
            string linkPath,
            int leadTimeHours)
        {
            if (!_options.EmailEnabled || string.IsNullOrWhiteSpace(recipient.Email))
            {
                return;
            }

            emailMessages.Add(
                NotificationEmailTemplateFactory.CreateScheduleReminderMessage(
                    recipient.Email,
                    "Examxy",
                    item.Title,
                    item.Type,
                    leadTimeHours,
                    BuildFrontendUrl(linkPath)));
        }

        private string BuildFrontendUrl(string path)
        {
            return new Uri(new Uri(_appUrlOptions.FrontendBaseUrl), path).ToString();
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

        private readonly record struct ReminderRecipient(
            string UserId,
            string Email);
    }
}
