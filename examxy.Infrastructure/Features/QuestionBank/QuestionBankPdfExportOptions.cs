namespace examxy.Infrastructure.Features.QuestionBank
{
    public sealed class QuestionBankPdfExportOptions
    {
        public const string SectionName = "QuestionBankPdfExport";

        public bool Enabled { get; set; }
        public string CompilerPath { get; set; } = "xelatex";
        public int TimeoutSeconds { get; set; } = 30;
        public int PollIntervalSeconds { get; set; } = 30;
        public string WorkRootPath { get; set; } = "App_Data/question-bank-export-work";
    }
}
