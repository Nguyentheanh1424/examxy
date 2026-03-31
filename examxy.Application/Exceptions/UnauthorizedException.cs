using System;

namespace examxy.Application.Exceptions
{
    public sealed class UnauthorizedException : AppException
    {
        public UnauthorizedException(string message, Exception? innerException = null)
            : base(message, 401, "unauthorized", innerException)
        {
        }
    }
}
