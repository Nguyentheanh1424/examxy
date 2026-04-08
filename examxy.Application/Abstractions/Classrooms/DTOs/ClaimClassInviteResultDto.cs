namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class ClaimClassInviteResultDto
    {
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string ClassCode { get; set; } = string.Empty;
        public string MembershipStatus { get; set; } = string.Empty;
        public DateTime JoinedAtUtc { get; set; }
    }
}
