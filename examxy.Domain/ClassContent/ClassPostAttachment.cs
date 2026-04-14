namespace examxy.Domain.ClassContent
{
    public class ClassPostAttachment
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }

        public ClassPost Post { get; set; } = null!;
    }
}
