namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class IdentityAuditIssueDto
    {
        public string IssueType { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
        public string Details { get; set; } = string.Empty;
    }
}
