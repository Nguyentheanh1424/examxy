namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Editable account profile returned by <c>GET /api/account/profile</c>.
    /// </summary>
    public class AccountProfileDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public string PrimaryRole { get; set; } = string.Empty;
        public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
        public string PhoneNumber { get; set; } = string.Empty;
        public string TimeZoneId { get; set; } = "Asia/Ho_Chi_Minh";
        public string Bio { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? AvatarDataUrl { get; set; }
    }
}
