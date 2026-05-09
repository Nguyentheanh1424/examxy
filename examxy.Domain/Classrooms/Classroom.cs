namespace examxy.Domain.Classrooms
{
    public class Classroom
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Grade { get; set; } = string.Empty;
        public string Term { get; set; } = string.Empty;
        public ClassJoinMode JoinMode { get; set; } = ClassJoinMode.InviteOnly;
        public string OwnerTeacherUserId { get; set; } = string.Empty;
        public string TimezoneId { get; set; } = "Asia/Ho_Chi_Minh";
        public ClassStatus Status { get; set; }
        public DateTime CreatedAtUtc { get; set; }

        public ICollection<ClassMembership> Memberships { get; set; } = new List<ClassMembership>();
        public ICollection<ClassInvite> Invites { get; set; } = new List<ClassInvite>();
        public ICollection<StudentImportBatch> ImportBatches { get; set; } = new List<StudentImportBatch>();
    }
}
