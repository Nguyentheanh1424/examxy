namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Summary of a class shown in the teacher dashboard list.
    /// </summary>
    public class TeacherClassSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Grade { get; set; } = string.Empty;
        public string Term { get; set; } = string.Empty;
        public string JoinMode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public int ActiveStudentCount { get; set; }
        public int PendingInviteCount { get; set; }
    }
}
