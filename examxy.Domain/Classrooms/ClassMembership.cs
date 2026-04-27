namespace examxy.Domain.Classrooms;

public class ClassMembership
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public string StudentUserId { get; set; } = string.Empty;
    public ClassMembershipStatus Status { get; set; }
    public DateTime? JoinedAtUtc { get; set; }

    public Classroom Class { get; set; } = null!;
}
