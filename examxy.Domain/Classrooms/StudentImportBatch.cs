namespace examxy.Domain.Classrooms
{
    public class StudentImportBatch
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string TeacherUserId { get; set; } = string.Empty;
        public string SourceFileName { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public int TotalRows { get; set; }
        public int CreatedAccountCount { get; set; }
        public int SentInviteCount { get; set; }
        public int SkippedCount { get; set; }
        public int RejectedCount { get; set; }

        public Classroom Class { get; set; } = null!;
        public ICollection<StudentImportItem> Items { get; set; } = new List<StudentImportItem>();
    }
}