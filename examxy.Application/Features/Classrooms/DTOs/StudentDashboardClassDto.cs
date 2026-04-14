namespace examxy.Application.Features.Classrooms.DTOs
{
    public class StudentDashboardClassDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string MembershipStatus { get; set; } = string.Empty;
        public DateTime? JoinedAtUtc { get; set; }
    }
}
