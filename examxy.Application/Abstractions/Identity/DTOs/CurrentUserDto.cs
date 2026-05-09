namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Current authenticated user profile returned by <c>GET /api/auth/me</c>.
    /// </summary>
    public class CurrentUserDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Human-readable full name shown in dashboards and account views.
        /// </summary>
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string TimeZoneId { get; set; } = "Asia/Ho_Chi_Minh";
        public string Bio { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? AvatarDataUrl { get; set; }

        /// <summary>
        /// Indicates whether the user has completed email confirmation.
        /// </summary>
        public bool EmailConfirmed { get; set; }

        /// <summary>
        /// Primary application role used for role-based routing.
        /// </summary>
        public string PrimaryRole { get; set; } = string.Empty;

        /// <summary>
        /// Full role set assigned to the account.
        /// </summary>
        public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    }
}
