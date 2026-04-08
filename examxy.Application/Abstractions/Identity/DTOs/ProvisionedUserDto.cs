namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class ProvisionedUserDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PrimaryRole { get; set; } = string.Empty;
        public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    }
}
