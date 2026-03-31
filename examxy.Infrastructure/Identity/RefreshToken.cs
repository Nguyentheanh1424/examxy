using System;
using System.Collections.Generic;
using System.Text;

namespace examxy.Infrastructure.Identity
{
    public class RefreshToken
    {
        public Guid Id { get; set; }

        public string Token { get; set; } = string.Empty;

        public DateTime ExpiresAtUtc { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        public DateTime? RevokedAtUtc { get; set; }

        public string UserId { get; set; } = string.Empty;

        public ApplicationUser User { get; set; } = default!;

        public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;

        public bool IsRevoked => RevokedAtUtc.HasValue;

        public bool IsActive => !IsExpired && !IsRevoked;
    }
}
