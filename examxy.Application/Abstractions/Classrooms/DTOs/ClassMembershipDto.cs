namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class ClassMembershipDto
    {
        public Guid Id { get; set; }
        public string StudentUserId { get; set; } = string.Empty;
        public string StudentUserName { get; set; } = string.Empty;
        public string StudentFullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? JoinedAtUtc { get; set; }
    }
}
