namespace examxy.Domain.QuestionBank
{
    public class QuestionBankExportJobItem
    {
        public Guid Id { get; set; }
        public Guid ExportJobId { get; set; }
        public Guid QuestionBankQuestionId { get; set; }
        public Guid QuestionBankQuestionVersionId { get; set; }
        public int OrderIndex { get; set; }
        public string RenderedLatexFragment { get; set; } = string.Empty;
        public string WarningsJson { get; set; } = "[]";

        public QuestionBankExportJob ExportJob { get; set; } = null!;
        public QuestionBankQuestion Question { get; set; } = null!;
        public QuestionBankQuestionVersion QuestionVersion { get; set; } = null!;
    }
}
