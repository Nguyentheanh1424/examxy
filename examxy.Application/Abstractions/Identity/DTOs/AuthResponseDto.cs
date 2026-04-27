namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Authentication response returned after registration, login, or token refresh.
    /// </summary>
    public class AuthResponseDto
    {
        /// <summary>
        /// Stable identifier of the authenticated user.
        /// </summary>
        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// Display login name used by the account.
        /// </summary>
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// Primary email address of the account.
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Primary application role used by clients for dashboard routing.
        /// </summary>
        public string PrimaryRole { get; set; } = string.Empty;

        /// <summary>
        /// Bearer token used for authenticated API calls.
        /// </summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// Refresh token used to obtain a new access token.
        /// </summary>
        public string RefreshToken { get; set; } = string.Empty;

        /// <summary>
        /// UTC time when the access token expires.
        /// </summary>
        public DateTime ExpiresAtUtc { get; set; }

        /// <summary>
        /// Full role set retained for compatibility with older clients and diagnostics.
        /// </summary>
        public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    }
}
