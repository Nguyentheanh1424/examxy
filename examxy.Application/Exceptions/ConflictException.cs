using System;

namespace examxy.Application.Exceptions
{
    public sealed class ConflictException : AppException
    {
        public ConflictException(string message, Exception? innerException = null)
            : base(message, 409, "conflict_error", innerException)
        {
        }
    }
}
