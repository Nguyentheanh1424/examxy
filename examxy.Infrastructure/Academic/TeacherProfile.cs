using examxy.Infrastructure.Identity;

namespace examxy.Infrastructure.Academic
{
    public class TeacherProfile
    {
        public string UserId { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }

        public ApplicationUser User { get; set; } = null!;
    }
}
