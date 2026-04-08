namespace examxy.Application.Exceptions
{
    public sealed class RuleViolationException : AppException
    {
        public RuleViolationException(
            string message,
            string errorCode,
            int statusCode = 409,
            Exception? innerException = null)
            : base(message, statusCode, errorCode, innerException)
        {
        }
    }
}
