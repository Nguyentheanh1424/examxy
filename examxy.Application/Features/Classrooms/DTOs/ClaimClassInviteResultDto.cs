namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Successful result of claiming a class invite.
    /// </summary>
    public class ClaimClassInviteResultDto
    {
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string ClassCode { get; set; } = string.Empty;
        public string MembershipStatus { get; set; } = string.Empty;
        public DateTime JoinedAtUtc { get; set; }
    }
}
