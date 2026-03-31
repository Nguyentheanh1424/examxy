using System;

namespace examxy.Application.Exceptions
{
    public abstract class AppException : Exception
    {
        protected AppException(
            string message,
            int statusCode,
            string errorCode,
            Exception? innerException = null)
            : base(message, innerException)
        {
            StatusCode = statusCode;
            ErrorCode = errorCode;
        }

        public int StatusCode { get; }

        public string ErrorCode { get; }
    }
}
