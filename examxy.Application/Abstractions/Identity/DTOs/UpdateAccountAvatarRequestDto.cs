namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Browser-uploaded avatar content after controller-level file parsing.
    /// </summary>
    public class UpdateAccountAvatarRequestDto
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public byte[] Content { get; set; } = Array.Empty<byte>();
    }
}
