namespace examxy.Server.Contracts
{
    /// <summary>
    /// Standard JSON error contract returned by the API exception middleware.
    /// </summary>
    /// <remarks>
    /// Validation failures may also populate <see cref="Errors" /> with field-level details.
    /// </remarks>
    public sealed class ApiErrorResponse
    {
        /// <summary>
        /// HTTP status code returned by the response.
        /// </summary>
        public int StatusCode { get; init; }

        /// <summary>
        /// Stable machine-readable error code.
        /// </summary>
        public string Code { get; init; } = string.Empty;

        /// <summary>
        /// Human-readable error message.
        /// </summary>
        public string Message { get; init; } = string.Empty;

        /// <summary>
        /// Trace identifier useful for log correlation.
        /// </summary>
        public string TraceId { get; init; } = string.Empty;

        /// <summary>
        /// Optional field-level validation errors keyed by field name.
        /// </summary>
        public IDictionary<string, string[]>? Errors { get; init; }
    }
}
