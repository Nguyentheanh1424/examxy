namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Non-mutating server-side roster validation preview.
    /// </summary>
    public class RosterImportPreviewDto
    {
        public Guid ClassId { get; set; }
        public string SourceFileName { get; set; } = string.Empty;
        public int TotalRows { get; set; }
        public int ReadyCount { get; set; }
        public int WarningCount { get; set; }
        public int ErrorCount { get; set; }
        public IReadOnlyCollection<RosterImportPreviewItemDto> Items { get; set; } =
            Array.Empty<RosterImportPreviewItemDto>();
    }
}
