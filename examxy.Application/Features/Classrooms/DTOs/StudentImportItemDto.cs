namespace examxy.Application.Features.Classrooms.DTOs
{
    public class StudentImportItemDto
    {
        public Guid Id { get; set; }
        public int RowNumber { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ResultType { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string StudentUserId { get; set; } = string.Empty;
        public Guid? ClassInviteId { get; set; }
    }
}
