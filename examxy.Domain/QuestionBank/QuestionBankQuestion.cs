namespace examxy.Domain.QuestionBank
{
    public class QuestionBankQuestion
    {
        public Guid Id { get; set; }
        public string OwnerTeacherUserId { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int CurrentVersionNumber { get; set; }
        public QuestionStatus Status { get; set; }
        public DateTime? LastUsedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public ICollection<QuestionBankQuestionVersion> Versions { get; set; } = new List<QuestionBankQuestionVersion>();
        public ICollection<QuestionBankQuestionTag> QuestionTags { get; set; } = new List<QuestionBankQuestionTag>();
    }
}
