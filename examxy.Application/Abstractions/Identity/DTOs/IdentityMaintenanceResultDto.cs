namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class IdentityMaintenanceResultDto
    {
        public string Operation { get; set; } = string.Empty;
        public int ScannedCount { get; set; }
        public int ChangedCount { get; set; }
        public IReadOnlyCollection<string> Warnings { get; set; } = Array.Empty<string>();
    }
}
