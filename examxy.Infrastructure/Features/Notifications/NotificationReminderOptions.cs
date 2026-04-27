namespace examxy.Infrastructure.Features.Notifications
{
    public sealed class NotificationReminderOptions
    {
        public const string SectionName = "NotificationReminders";

        public bool Enabled { get; set; } = true;
        public int LeadTimeHours { get; set; } = 24;
        public int PollIntervalSeconds { get; set; } = 60;
        public int LookbackMinutes { get; set; } = 10;
        public int BatchSize { get; set; } = 200;
    }
}
