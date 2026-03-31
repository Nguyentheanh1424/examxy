using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace examxy.Infrastructure.Identity.Services
{
    public class AuthService : IAuthService
    {
        private const string DefaultUserRole = "User";

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ITokenService _tokenService;
        private readonly AppDbContext _dbContext;
        private readonly JwtOptions _jwtOptions;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            RoleManager<IdentityRole> roleManager,
            ITokenService tokenService,
            AppDbContext dbContext,
            IOptions<JwtOptions> jwtOptions)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
            _tokenService = tokenService;
            _dbContext = dbContext;
            _jwtOptions = jwtOptions.Value;
        }

        public async Task<AuthResponseDto> RegisterAsync(
            RegisterRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var existingUserByUserName = await _userManager.FindByNameAsync(request.UserName);
            if (existingUserByUserName is not null)
            {
                throw new ConflictException("Username is already taken.");
            }

            var existingUserByEmail = await _userManager.FindByEmailAsync(request.Email);
            if (existingUserByEmail is not null)
            {
                throw new ConflictException("Email is already registered.");
            }

            var user = new ApplicationUser
            {
                UserName = request.UserName,
                Email = request.Email,
                EmailConfirmed = false
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(createResult.Errors);
            }

            if (await _roleManager.RoleExistsAsync(DefaultUserRole))
            {
                var addToRoleResult = await _userManager.AddToRoleAsync(user, DefaultUserRole);
                if (!addToRoleResult.Succeeded)
                {
                    throw IdentityExceptionFactory.CreateFromErrors(
                        addToRoleResult.Errors,
                        "Failed to assign the default role.");
                }
            }

            return await CreateAuthResponseAsync(user, cancellationToken);
        }

        public async Task<AuthResponseDto> LoginAsync(
            LoginRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await FindByUserNameOrEmailAsync(request.UserNameOrEmail);
            if (user is null)
            {
                throw new UnauthorizedException("Invalid credentials.");
            }

            var signInResult = await _signInManager.CheckPasswordSignInAsync(
                user,
                request.Password,
                lockoutOnFailure: true);

            if (!signInResult.Succeeded)
            {
                if (signInResult.IsLockedOut)
                {
                    throw new ForbiddenException("User account is temporarily locked.");
                }

                throw new UnauthorizedException("Invalid credentials.");
            }

            return await CreateAuthResponseAsync(user, cancellationToken);
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(
            RefreshTokenRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var principal = GetPrincipalFromExpiredToken(request.AccessToken);

            var userId =
                principal.FindFirstValue(ClaimTypes.NameIdentifier) ??
                principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new UnauthorizedException("Invalid access token.");
            }

            var user = await _userManager.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }

            var storedRefreshToken = user.RefreshTokens
                .FirstOrDefault(rt => rt.Token == request.RefreshToken);

            if (storedRefreshToken is null || !storedRefreshToken.IsActive)
            {
                throw new UnauthorizedException("Invalid refresh token.");
            }

            storedRefreshToken.RevokedAtUtc = DateTime.UtcNow;

            return await CreateAuthResponseAsync(user, cancellationToken);
        }

        public async Task LogoutAsync(
            string userId,
            LogoutRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var storedRefreshToken = await _dbContext.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken);

            if (storedRefreshToken is null ||
                !string.Equals(storedRefreshToken.UserId, userId, StringComparison.Ordinal))
            {
                throw new ForbiddenException("Refresh token is not valid for the authenticated user.");
            }

            if (!storedRefreshToken.IsRevoked)
            {
                storedRefreshToken.RevokedAtUtc = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        private async Task<AuthResponseDto> CreateAuthResponseAsync(
            ApplicationUser user,
            CancellationToken cancellationToken)
        {
            var roles = await _userManager.GetRolesAsync(user);

            var accessTokenExpirationUtc = _tokenService.GetAccessTokenExpirationUtc();
            var refreshTokenExpirationUtc = _tokenService.GetRefreshTokenExpirationUtc();

            var accessToken = _tokenService.GenerateAccessToken(
                user.Id,
                user.Email ?? string.Empty,
                user.UserName ?? string.Empty,
                roles);

            var refreshTokenValue = _tokenService.GenerateRefreshToken();

            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                Token = refreshTokenValue,
                UserId = user.Id,
                CreatedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = refreshTokenExpirationUtc
            };

            _dbContext.RefreshTokens.Add(refreshToken);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new AuthResponseDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                AccessToken = accessToken,
                RefreshToken = refreshTokenValue,
                ExpiresAtUtc = accessTokenExpirationUtc,
                Roles = roles.ToArray()
            };
        }

        private async Task<ApplicationUser?> FindByUserNameOrEmailAsync(string userNameOrEmail)
        {
            if (string.IsNullOrWhiteSpace(userNameOrEmail))
            {
                return null;
            }

            if (userNameOrEmail.Contains('@'))
            {
                var userByEmail = await _userManager.FindByEmailAsync(userNameOrEmail);
                if (userByEmail is not null)
                {
                    return userByEmail;
                }
            }

            return await _userManager.FindByNameAsync(userNameOrEmail);
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string accessToken)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtOptions.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(_jwtOptions.SecretKey)),
                ValidateLifetime = false,
                ClockSkew = TimeSpan.Zero
            };

            var tokenHandler = new JwtSecurityTokenHandler();

            var principal = tokenHandler.ValidateToken(
                accessToken,
                tokenValidationParameters,
                out var securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(
                    SecurityAlgorithms.HmacSha256,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedException("Invalid access token.");
            }

            return principal;
        }
    }
}
