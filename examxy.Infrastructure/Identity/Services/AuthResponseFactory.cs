using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;

namespace examxy.Infrastructure.Identity.Services
{
    public sealed class AuthResponseFactory
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly AppDbContext _dbContext;

        public AuthResponseFactory(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            AppDbContext dbContext)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _dbContext = dbContext;
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

            var accessToken = _tokenService.GenerateAccessToken(
                user.Id,
                user.Email ?? string.Empty,
                user.UserName ?? string.Empty,
                roles);

            var refreshTokenValue = _tokenService.GenerateRefreshToken();

            _dbContext.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = refreshTokenValue,
                UserId = user.Id,
                CreatedAtUtc = DateTime.UtcNow,
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
    }
}
