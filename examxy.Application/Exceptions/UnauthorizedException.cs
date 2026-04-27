using System;

namespace examxy.Application.Exceptions
{
    public sealed class UnauthorizedException : AppException
    {
        public UnauthorizedException(
            string message,
            string errorCode = "unauthorized",
            Exception? innerException = null)
            : base(message, 401, errorCode, innerException)
        {
        }
    }
}
