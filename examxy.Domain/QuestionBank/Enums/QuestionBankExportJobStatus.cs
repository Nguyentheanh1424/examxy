namespace examxy.Domain.QuestionBank
{
    public enum QuestionBankExportJobStatus
    {
        Queued,
        Rendering,
        Compiling,
        Completed,
        Failed,
        Cancelled
    }
}
