namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class AdminSystemHealthSummaryDto
    {
        public string Service { get; set; } = string.Empty;
        public string Status { get; set; } = "Healthy";
        public int LatencyMs { get; set; }
        public DateTime CheckedAtUtc { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
