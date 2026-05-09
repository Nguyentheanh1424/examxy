namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class AdminDashboardSummaryDto
    {
        public string ContractStatus { get; set; } = "ApiReady";
        public int UserCount { get; set; }
        public int ActiveTeacherCount { get; set; }
        public int ActiveStudentCount { get; set; }
        public int UnresolvedAuditCount { get; set; }
        public string ServiceHealth { get; set; } = "Healthy";
    }
}
