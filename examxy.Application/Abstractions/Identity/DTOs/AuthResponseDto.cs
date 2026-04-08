using System;
using System.Collections.Generic;
using System.Text;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class AuthResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PrimaryRole { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
        public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    }
}
