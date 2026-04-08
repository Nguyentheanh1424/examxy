namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class TeacherClassDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public IReadOnlyCollection<ClassMembershipDto> Memberships { get; set; } = Array.Empty<ClassMembershipDto>();
        public IReadOnlyCollection<ClassInviteDto> Invites { get; set; } = Array.Empty<ClassInviteDto>();
        public IReadOnlyCollection<StudentImportBatchDto> ImportBatches { get; set; } = Array.Empty<StudentImportBatchDto>();
    }
}
