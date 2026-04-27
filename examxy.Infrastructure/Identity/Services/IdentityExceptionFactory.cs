using examxy.Application.Exceptions;
using Microsoft.AspNetCore.Identity;

namespace examxy.Infrastructure.Identity.Services
{
    internal static class IdentityExceptionFactory
    {
        public static AppException CreateFromErrors(
            IEnumerable<IdentityError> errors,
            string defaultMessage = "One or more identity validation errors occurred.")
        {
            var errorList = errors
                .Where(static error => !string.IsNullOrWhiteSpace(error.Description))
                .ToArray();

            if (errorList.Length == 0)
            {
                return new ValidationException(defaultMessage);
            }

            var message = string.Join(
                "; ",
                errorList.Select(static error => error.Description).Distinct());

            if (errorList.Any(static error => IsConflictCode(error.Code)))
            {
                return new ConflictException(message);
            }

            var validationErrors = errorList
                .GroupBy(
                    static error => string.IsNullOrWhiteSpace(error.Code) ? "Identity" : error.Code,
                    StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    static group => group.Key,
                    static group => group.Select(error => error.Description).Distinct().ToArray(),
                    StringComparer.OrdinalIgnoreCase);

            return new ValidationException(message, validationErrors);
        }

        private static bool IsConflictCode(string? code)
        {
            return string.Equals(
                       code,
                       nameof(IdentityErrorDescriber.DuplicateUserName),
                       StringComparison.OrdinalIgnoreCase)
                   || string.Equals(
                       code,
                       nameof(IdentityErrorDescriber.DuplicateEmail),
                       StringComparison.OrdinalIgnoreCase)
                   || string.Equals(
                       code,
                       nameof(IdentityErrorDescriber.DuplicateRoleName),
                       StringComparison.OrdinalIgnoreCase);
        }
    }
}
