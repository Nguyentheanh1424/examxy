namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class IdentityAuditReportDto
    {
        public int UsersScanned { get; set; }
        public int MissingPrimaryRoleCount { get; set; }
        public int MissingTeacherProfileCount { get; set; }
        public int MissingStudentProfileCount { get; set; }
        public int LegacyAssignmentCount { get; set; }
        public IReadOnlyCollection<IdentityAuditIssueDto> Issues { get; set; } = Array.Empty<IdentityAuditIssueDto>();
    }
}
