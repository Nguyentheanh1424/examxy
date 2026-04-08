namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class TeacherClassSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public int ActiveStudentCount { get; set; }
        public int PendingInviteCount { get; set; }
    }
}
