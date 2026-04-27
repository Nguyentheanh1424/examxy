namespace examxy.Application.Features.Notifications
{
    public interface INotificationReminderProcessor
    {
        Task<NotificationReminderProcessingResult> ProcessDueRemindersAsync(
            CancellationToken cancellationToken = default);
    }

    public sealed class NotificationReminderProcessingResult
    {
        public int ItemsScanned { get; set; }
        public int RecipientsEvaluated { get; set; }
        public int CreatedCount { get; set; }
        public int SkippedExistingCount { get; set; }
        public int ErrorCount { get; set; }
    }
}
