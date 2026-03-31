using System;
using System.Collections.Generic;
using System.Text;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class CurrentUserDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
    }
}
