namespace examxy.Infrastructure.Features.QuestionBank
{
    public sealed class QuestionBankAttachmentStorageOptions
    {
        public const string SectionName = "QuestionBankAttachmentStorage";

        public string Provider { get; set; } = "Local";
        public string RootPath { get; set; } = "App_Data/question-bank-attachments";
    }
}
