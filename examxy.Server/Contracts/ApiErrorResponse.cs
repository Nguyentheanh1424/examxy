using System.Collections.Generic;

namespace examxy.Server.Contracts
{
    public sealed class ApiErrorResponse
    {
        public int StatusCode { get; init; }

        public string Code { get; init; } = string.Empty;

        public string Message { get; init; } = string.Empty;

        public string TraceId { get; init; } = string.Empty;

        public IDictionary<string, string[]>? Errors { get; init; }
    }
}
