using examxy.Infrastructure.Academic;
using Microsoft.AspNetCore.Identity;

namespace examxy.Infrastructure.Identity
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? LastActivatedAtUtc { get; set; }

        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public TeacherProfile? TeacherProfile { get; set; }
        public StudentProfile? StudentProfile { get; set; }
        public ICollection<Classroom> OwnedClasses { get; set; } = new List<Classroom>();
        public ICollection<ClassMembership> ClassMemberships { get; set; } = new List<ClassMembership>();
        public ICollection<ClassInvite> StudentInvites { get; set; } = new List<ClassInvite>();
        public ICollection<ClassInvite> UsedClassInvites { get; set; } = new List<ClassInvite>();
        public ICollection<StudentImportBatch> TeacherImportBatches { get; set; } = new List<StudentImportBatch>();
        public ICollection<StudentImportItem> StudentImportItems { get; set; } = new List<StudentImportItem>();
    }
}
