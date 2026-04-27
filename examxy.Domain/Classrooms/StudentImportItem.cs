namespace examxy.Domain.Classrooms;

public class StudentImportItem
{
    public Guid Id { get; set; }
    public Guid BatchId { get; set; }
    public int RowNumber { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public StudentImportItemResultType ResultType { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? StudentUserId { get; set; }
    public Guid? ClassInviteId { get; set; }

    public StudentImportBatch Batch { get; set; } = null!;
    public ClassInvite? ClassInvite { get; set; }
}
