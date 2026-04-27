using examxy.Application.Exceptions;
using examxy.Server.Contracts;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.ExceptionServices;
using DataAnnotationsValidationException = System.ComponentModel.DataAnnotations.ValidationException;

namespace examxy.Server.Middleware
{
    public sealed class GlobalExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public GlobalExceptionHandlingMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionHandlingMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception exception)
            {
                await HandleExceptionAsync(context, exception);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogWarning(
                    exception,
                    "Cannot handle exception because the response has already started. TraceId: {TraceId}",
                    context.TraceIdentifier);

                ExceptionDispatchInfo.Capture(exception).Throw();
            }

            var appException = MapException(exception);

            if (appException is null)
            {
                _logger.LogError(
                    exception,
                    "Unhandled exception. TraceId: {TraceId}",
                    context.TraceIdentifier);
            }
            else
            {
                _logger.LogWarning(
                    exception,
                    "Handled application exception {ExceptionType}. TraceId: {TraceId}",
                    appException.GetType().Name,
                    context.TraceIdentifier);
            }

            var response = BuildResponse(context, exception, appException);

            context.Response.Clear();
            context.Response.StatusCode = response.StatusCode;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(response);
        }

        private ApiErrorResponse BuildResponse(
            HttpContext context,
            Exception exception,
            AppException? appException)
        {
            if (appException is ValidationException validationException)
            {
                return new ApiErrorResponse
                {
                    StatusCode = validationException.StatusCode,
                    Code = validationException.ErrorCode,
                    Message = validationException.Message,
                    TraceId = context.TraceIdentifier,
                    Errors = validationException.Errors.Count == 0
                        ? null
                        : validationException.Errors.ToDictionary(
                            static entry => entry.Key,
                            static entry => entry.Value,
                            StringComparer.OrdinalIgnoreCase)
                };
            }

            if (appException is not null)
            {
                return new ApiErrorResponse
                {
                    StatusCode = appException.StatusCode,
                    Code = appException.ErrorCode,
                    Message = appException.Message,
                    TraceId = context.TraceIdentifier
                };
            }

            return new ApiErrorResponse
            {
                StatusCode = StatusCodes.Status500InternalServerError,
                Code = "internal_server_error",
                Message = _environment.IsDevelopment()
                    ? exception.Message
                    : "An unexpected error occurred.",
                TraceId = context.TraceIdentifier
            };
        }

        private static AppException? MapException(Exception exception)
        {
            return exception switch
            {
                AppException appException => appException,
                KeyNotFoundException keyNotFoundException =>
                    new NotFoundException(keyNotFoundException.Message, keyNotFoundException),
                UnauthorizedAccessException unauthorizedAccessException =>
                    new UnauthorizedException(
                        unauthorizedAccessException.Message,
                        "unauthorized",
                        unauthorizedAccessException),
                SecurityTokenException securityTokenException =>
                    new UnauthorizedException(
                        securityTokenException.Message,
                        "unauthorized",
                        securityTokenException),
                DataAnnotationsValidationException validationException =>
                    new ValidationException(
                        validationException.ValidationResult?.ErrorMessage ?? validationException.Message,
                        BuildValidationErrors(validationException),
                        validationException),
                _ => null
            };
        }

        private static IDictionary<string, string[]>? BuildValidationErrors(
            DataAnnotationsValidationException validationException)
        {
            var errorMessage =
                validationException.ValidationResult?.ErrorMessage ?? validationException.Message;

            if (string.IsNullOrWhiteSpace(errorMessage))
            {
                return null;
            }

            return new Dictionary<string, string[]>(
                StringComparer.OrdinalIgnoreCase)
            {
                ["Validation"] = new[] { errorMessage }
            };
        }
    }
}
