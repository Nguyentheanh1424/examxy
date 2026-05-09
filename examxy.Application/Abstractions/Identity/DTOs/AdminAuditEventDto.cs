namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class AdminAuditEventDto
    {
        public string Id { get; set; } = string.Empty;
        public DateTime OccurredAtUtc { get; set; }
        public string Actor { get; set; } = string.Empty;
        public string Module { get; set; } = string.Empty;
        public string Severity { get; set; } = "Info";
        public string Action { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
    }
}
