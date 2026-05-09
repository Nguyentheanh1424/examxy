namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class AdminAuditQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Query { get; set; }
        public string? Module { get; set; }
        public string? Severity { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
    }
}
