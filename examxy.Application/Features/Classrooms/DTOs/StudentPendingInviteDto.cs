namespace examxy.Application.Features.Classrooms.DTOs
{
    public class StudentPendingInviteDto
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string ClassCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime SentAtUtc { get; set; }
    }
}
