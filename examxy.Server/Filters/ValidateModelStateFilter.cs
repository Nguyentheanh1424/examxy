using examxy.Application.Exceptions;
using Microsoft.AspNetCore.Mvc.Filters;

namespace examxy.Server.Filters
{
    public sealed class ValidateModelStateFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ModelState.IsValid)
            {
                return;
            }

            var errors = context.ModelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .ToDictionary(
                    static entry => string.IsNullOrWhiteSpace(entry.Key) ? "request" : entry.Key,
                    static entry => entry.Value!.Errors
                        .Select(static error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                            ? "The input was not valid."
                            : error.ErrorMessage)
                        .ToArray(),
                    StringComparer.OrdinalIgnoreCase);

            throw new ValidationException("One or more validation errors occurred.", errors);
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }
    }
}
