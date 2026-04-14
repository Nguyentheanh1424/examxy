namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Result of a teacher roster import batch.
    /// </summary>
    public class StudentImportBatchDto
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string SourceFileName { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public int TotalRows { get; set; }
        public int CreatedAccountCount { get; set; }
        public int SentInviteCount { get; set; }
        public int SkippedCount { get; set; }
        public int RejectedCount { get; set; }
        /// <summary>
        /// Per-row import outcomes including created accounts, sent invites, skips, and rejections.
        /// </summary>
        public IReadOnlyCollection<StudentImportItemDto> Items { get; set; } = Array.Empty<StudentImportItemDto>();
    }
}
