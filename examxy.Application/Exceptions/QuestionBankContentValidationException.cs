namespace examxy.Application.Exceptions
{
    public sealed class QuestionBankContentValidationException : AppException
    {
        public QuestionBankContentValidationException(
            string message,
            IDictionary<string, string[]>? errors = null,
            Exception? innerException = null)
            : base(message, 400, "question_bank_content_invalid", innerException)
        {
            Errors = errors is null
                ? new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
                : new Dictionary<string, string[]>(errors, StringComparer.OrdinalIgnoreCase);
        }

        public IReadOnlyDictionary<string, string[]> Errors { get; }
    }
}
