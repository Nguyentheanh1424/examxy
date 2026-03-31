using System;

namespace examxy.Application.Exceptions
{
    public sealed class NotFoundException : AppException
    {
        public NotFoundException(string message, Exception? innerException = null)
            : base(message, 404, "not_found", innerException)
        {
        }

        public NotFoundException(string resourceName, object? resourceKey)
            : this(resourceKey is null
                ? $"{resourceName} was not found."
                : $"{resourceName} '{resourceKey}' was not found.")
        {
        }
    }
}
