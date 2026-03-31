using System;

namespace examxy.Application.Exceptions
{
    public sealed class ForbiddenException : AppException
    {
        public ForbiddenException(
            string message = "You do not have permission to access this resource.",
            Exception? innerException = null)
            : base(message, 403, "forbidden", innerException)
        {
        }
    }
}
