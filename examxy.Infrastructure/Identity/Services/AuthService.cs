using examxy.Application.Abstractions.Email;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Email;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace examxy.Infrastructure.Identity.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IEmailSender _emailSender;
        private readonly AppDbContext _dbContext;
        private readonly JwtOptions _jwtOptions;
        private readonly AppUrlOptions _appUrlOptions;
        private readonly RoleAssignmentService _roleAssignmentService;
        private readonly AuthResponseFactory _authResponseFactory;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ITokenService tokenService,
            IEmailSender emailSender,
            AppDbContext dbContext,
            IOptions<JwtOptions> jwtOptions,
            IOptions<AppUrlOptions> appUrlOptions,
            RoleAssignmentService roleAssignmentService,
            AuthResponseFactory authResponseFactory)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _emailSender = emailSender;
            _dbContext = dbContext;
            _jwtOptions = jwtOptions.Value;
            _appUrlOptions = appUrlOptions.Value;
            _roleAssignmentService = roleAssignmentService;
            _authResponseFactory = authResponseFactory;
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
                UserName = request.UserName.Trim(),
                Email = request.Email.Trim(),
                EmailConfirmed = false,
                FullName = string.IsNullOrWhiteSpace(request.FullName)
                    ? request.UserName.Trim()
                    : request.FullName.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(createResult.Errors);
            }

            await _roleAssignmentService.SetSingleRoleAsync(user, IdentityRoles.Teacher);

            _dbContext.TeacherProfiles.Add(new TeacherProfile
            {
                UserId = user.Id,
                CreatedAtUtc = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync(cancellationToken);

            try
            {
                await SendEmailConfirmationAsync(user, cancellationToken);
            }
            catch
            {
                await _userManager.DeleteAsync(user);
                throw;
            }

            return await _authResponseFactory.CreateAsync(user, cancellationToken);
        }

        public async Task<AuthResponseDto> LoginAsync(
            LoginRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await FindByUserNameOrEmailAsync(request.UserNameOrEmail);
            if (user is null)
            {
                throw new UnauthorizedException("Invalid credentials.", "invalid_credentials");
            }

            var signInResult = await _signInManager.CheckPasswordSignInAsync(
                user,
                request.Password,
                lockoutOnFailure: true);

            if (!signInResult.Succeeded)
            {
                if (signInResult.IsLockedOut)
                {
                    throw new ForbiddenException("User account is temporarily locked.", "account_locked");
                }

                if (signInResult.IsNotAllowed && !user.EmailConfirmed)
                {
                    throw new ForbiddenException(
                        "Email confirmation is required before login.",
                        "email_confirmation_required");
                }

                throw new UnauthorizedException("Invalid credentials.", "invalid_credentials");
            }

            user.LastActivatedAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return await _authResponseFactory.CreateAsync(user, cancellationToken);
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
                .Include(candidate => candidate.RefreshTokens)
                .FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);

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

            return await _authResponseFactory.CreateAsync(user, cancellationToken);
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

        private async Task SendEmailConfirmationAsync(
            ApplicationUser user,
            CancellationToken cancellationToken)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = EmailTokenCodec.Encode(token);
            var confirmationUrl = QueryHelpers.AddQueryString(
                BuildFrontendUrl(_appUrlOptions.ConfirmEmailPath),
                new Dictionary<string, string?>
                {
                    ["userId"] = user.Id,
                    ["token"] = encodedToken
                });

            await _emailSender.SendAsync(
                AuthEmailTemplateFactory.CreateEmailConfirmationMessage(
                    user.Email ?? string.Empty,
                    "Examxy",
                    confirmationUrl),
                cancellationToken);
        }

        private string BuildFrontendUrl(string path)
        {
            return new Uri(new Uri(_appUrlOptions.FrontendBaseUrl), path).ToString();
        }
    }
}
