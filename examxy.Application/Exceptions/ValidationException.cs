namespace examxy.Application.Exceptions
{
    public sealed class ValidationException : AppException
    {
        public ValidationException(
            string message,
            IDictionary<string, string[]>? errors = null,
            Exception? innerException = null)
            : base(message, 400, "validation_error", innerException)
        {
            Errors = errors is null
                ? new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
                : new Dictionary<string, string[]>(errors, StringComparer.OrdinalIgnoreCase);
        }

        public IReadOnlyDictionary<string, string[]> Errors { get; }
    }
}
