namespace examxy.Domain.QuestionBank
{
    public class QuestionBankTag
    {
        public Guid Id { get; set; }
        public string OwnerTeacherUserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string NormalizedName { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }

        public ICollection<QuestionBankQuestionTag> QuestionTags { get; set; } = new List<QuestionBankQuestionTag>();
    }
}
