using examxy.Infrastructure.Identity;

namespace examxy.Infrastructure.Academic
{
    public class Classroom
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string OwnerTeacherUserId { get; set; } = string.Empty;
        public ClassStatus Status { get; set; }
        public DateTime CreatedAtUtc { get; set; }

        public ApplicationUser OwnerTeacher { get; set; } = null!;
        public ICollection<ClassMembership> Memberships { get; set; } = new List<ClassMembership>();
        public ICollection<ClassInvite> Invites { get; set; } = new List<ClassInvite>();
        public ICollection<StudentImportBatch> ImportBatches { get; set; } = new List<StudentImportBatch>();
    }
}
