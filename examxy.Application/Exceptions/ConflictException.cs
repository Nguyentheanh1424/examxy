using System;

namespace examxy.Application.Exceptions
{
    public sealed class ConflictException : AppException
    {
        public ConflictException(
            string message,
            string errorCode = "conflict_error",
            Exception? innerException = null)
            : base(message, 409, errorCode, innerException)
        {
        }
    }
}
