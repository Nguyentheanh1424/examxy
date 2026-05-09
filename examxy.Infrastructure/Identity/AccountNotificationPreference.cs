namespace examxy.Infrastructure.Identity
{
    public class AccountNotificationPreference
    {
        public Guid Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string PreferenceKey { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;
        public bool Enabled { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        public ApplicationUser User { get; set; } = default!;
    }
}
