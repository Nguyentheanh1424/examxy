namespace examxy.Infrastructure.Features.Notifications
{
    public sealed class NotificationReminderOptions
    {
        public const string SectionName = "NotificationReminders";

        public bool Enabled { get; set; } = true;
        public int LeadTimeHours { get; set; } = 24;
        public int[] LeadTimesHours { get; set; } = Array.Empty<int>();
        public int PollIntervalSeconds { get; set; } = 60;
        public int LookbackMinutes { get; set; } = 10;
        public int BatchSize { get; set; } = 200;

        public IReadOnlyCollection<int> GetLeadTimesHours()
        {
            var configuredLeadTimes = LeadTimesHours
                .Where(leadTime => leadTime > 0)
                .Distinct()
                .OrderByDescending(leadTime => leadTime)
                .ToArray();

            return configuredLeadTimes.Length > 0
                ? configuredLeadTimes
                : new[] { LeadTimeHours };
        }
    }
}
