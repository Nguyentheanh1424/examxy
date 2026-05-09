namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Stored avatar binary returned for the current account.
    /// </summary>
    public class AccountAvatarDto
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public byte[] Content { get; set; } = Array.Empty<byte>();
    }
}
