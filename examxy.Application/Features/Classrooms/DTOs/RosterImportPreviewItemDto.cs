namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Server-side validation result for a roster row before import mutation.
    /// </summary>
    public class RosterImportPreviewItemDto
    {
        public int RowNumber { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public IReadOnlyCollection<string> Warnings { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<string> Errors { get; set; } = Array.Empty<string>();
    }
}
