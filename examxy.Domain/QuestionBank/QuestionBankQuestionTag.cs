namespace examxy.Domain.QuestionBank
{
    public class QuestionBankQuestionTag
    {
        public Guid QuestionId { get; set; }
        public Guid TagId { get; set; }

        public QuestionBankQuestion Question { get; set; } = null!;
        public QuestionBankTag Tag { get; set; } = null!;
    }
}
