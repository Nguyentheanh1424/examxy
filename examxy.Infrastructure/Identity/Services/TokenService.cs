using examxy.Application.Abstractions.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace examxy.Infrastructure.Identity.Services
{
    public class TokenService : ITokenService
    {
        private readonly JwtOptions _jwtOptions;

        public TokenService(IOptions<JwtOptions> jwtOptions)
        {
            _jwtOptions = jwtOptions.Value;
        }

        public string GenerateAccessToken(
            string userId,
            string email,
            string userName,
            IEnumerable<string> roles)
        {
            var expiresAtUtc = GetAccessTokenExpirationUtc();

            var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.UniqueName, userName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, userName)
        };

            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

            var signingKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_jwtOptions.SecretKey));

            var signingCredentials = new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

            var jwtToken = new JwtSecurityToken(
                issuer: _jwtOptions.Issuer,
                audience: _jwtOptions.Audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: expiresAtUtc,
                signingCredentials: signingCredentials);

            return new JwtSecurityTokenHandler().WriteToken(jwtToken);
        }

        public string GenerateRefreshToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(64);
            return Convert.ToBase64String(bytes);
        }

        public DateTime GetAccessTokenExpirationUtc()
        {
            return DateTime.UtcNow.AddMinutes(_jwtOptions.AccessTokenExpirationMinutes);
        }

        public DateTime GetRefreshTokenExpirationUtc()
        {
            return DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenExpirationDays);
        }
    }
}
