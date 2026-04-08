using examxy.Infrastructure.Identity;

namespace examxy.Infrastructure.Academic
{
    public class ClassInvite
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string NormalizedEmail { get; set; } = string.Empty;
        public string? StudentUserId { get; set; }
        public string InviteCodeHash { get; set; } = string.Empty;
        public ClassInviteStatus Status { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime SentAtUtc { get; set; }
        public DateTime? UsedAtUtc { get; set; }
        public string? UsedByUserId { get; set; }
        public DateTime ExpiresAtUtc { get; set; }

        public Classroom Class { get; set; } = null!;
        public ApplicationUser? StudentUser { get; set; }
        public ApplicationUser? UsedByUser { get; set; }
    }
}
