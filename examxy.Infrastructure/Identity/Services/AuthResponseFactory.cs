using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System.Net;

namespace examxy.Infrastructure.Identity.Services
{
    public sealed class AuthResponseFactory
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly AppDbContext _dbContext;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthResponseFactory(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            AppDbContext dbContext,
            IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _dbContext = dbContext;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<AuthResponseDto> CreateAsync(
            ApplicationUser user,
            CancellationToken cancellationToken = default)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = IdentityRoles.GetPrimaryRole(roles);

            if (string.IsNullOrWhiteSpace(primaryRole))
            {
                throw new InvalidOperationException("The authenticated user does not have a supported primary role.");
            }

            var accessTokenExpirationUtc = _tokenService.GetAccessTokenExpirationUtc();
            var refreshTokenExpirationUtc = _tokenService.GetRefreshTokenExpirationUtc();
            var sessionId = Guid.NewGuid();
            var sessionMetadata = GetSessionMetadata();

            var accessToken = _tokenService.GenerateAccessToken(
                user.Id,
                user.Email ?? string.Empty,
                user.UserName ?? string.Empty,
                sessionId.ToString(),
                roles);

            var refreshTokenValue = _tokenService.GenerateRefreshToken();
            var createdAtUtc = DateTime.UtcNow;

            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                Token = refreshTokenValue,
                UserId = user.Id,
                CreatedAtUtc = createdAtUtc,
                LastUsedAtUtc = createdAtUtc,
                Device = sessionMetadata.Device,
                DeviceType = sessionMetadata.DeviceType,
                Browser = sessionMetadata.Browser,
                Location = sessionMetadata.Location,
                IpAddressMasked = sessionMetadata.IpAddressMasked,
                ExpiresAtUtc = refreshTokenExpirationUtc
            });

            await _dbContext.SaveChangesAsync(cancellationToken);

            return new AuthResponseDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                PrimaryRole = primaryRole,
                AccessToken = accessToken,
                RefreshToken = refreshTokenValue,
                ExpiresAtUtc = accessTokenExpirationUtc,
                Roles = roles.ToArray()
            };
        }

        private SessionMetadata GetSessionMetadata()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            var userAgent = httpContext?.Request.Headers.UserAgent.ToString() ?? string.Empty;
            var remoteIpAddress = httpContext?.Connection.RemoteIpAddress;

            return new SessionMetadata(
                GetDevice(userAgent),
                GetDeviceType(userAgent),
                GetBrowser(userAgent),
                "Unknown location",
                MaskIpAddress(remoteIpAddress));
        }

        private static string GetDevice(string userAgent)
        {
            if (string.IsNullOrWhiteSpace(userAgent))
            {
                return "Current browser";
            }

            if (userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase) ||
                userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase))
            {
                return "Mobile browser";
            }

            if (userAgent.Contains("iPad", StringComparison.OrdinalIgnoreCase))
            {
                return "Tablet browser";
            }

            if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase))
            {
                return "Windows browser";
            }

            if (userAgent.Contains("Mac OS", StringComparison.OrdinalIgnoreCase))
            {
                return "Mac browser";
            }

            return "Web browser";
        }

        private static string GetDeviceType(string userAgent)
        {
            return userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase) ||
                   userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase)
                ? "Phone"
                : "Laptop";
        }

        private static string GetBrowser(string userAgent)
        {
            if (userAgent.Contains("Edg/", StringComparison.OrdinalIgnoreCase))
            {
                return "Microsoft Edge";
            }

            if (userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase))
            {
                return "Chrome";
            }

            if (userAgent.Contains("Firefox/", StringComparison.OrdinalIgnoreCase))
            {
                return "Firefox";
            }

            if (userAgent.Contains("Safari/", StringComparison.OrdinalIgnoreCase))
            {
                return "Safari";
            }

            return "Unknown browser";
        }

        private static string MaskIpAddress(IPAddress? ipAddress)
        {
            if (ipAddress is null)
            {
                return "Unknown IP";
            }

            if (ipAddress.IsIPv4MappedToIPv6)
            {
                ipAddress = ipAddress.MapToIPv4();
            }

            var bytes = ipAddress.GetAddressBytes();
            if (ipAddress.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork &&
                bytes.Length == 4)
            {
                return $"{bytes[0]}.{bytes[1]}.xxx.{bytes[3]}";
            }

            return "IPv6 masked";
        }

        private sealed record SessionMetadata(
            string Device,
            string DeviceType,
            string Browser,
            string Location,
            string IpAddressMasked);
    }
}
