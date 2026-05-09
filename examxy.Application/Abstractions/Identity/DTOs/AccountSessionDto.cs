namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Browser-safe session/device row backed by refresh-token metadata.
    /// </summary>
    public class AccountSessionDto
    {
        public Guid Id { get; set; }
        public string Device { get; set; } = string.Empty;
        public string Browser { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime LastActiveAtUtc { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public bool IsCurrent { get; set; }
        public bool IsRevoked { get; set; }
        public string DeviceType { get; set; } = "Laptop";
    }
}
