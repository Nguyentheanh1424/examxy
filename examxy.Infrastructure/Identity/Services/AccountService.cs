using examxy.Application.Abstractions.Email;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Infrastructure.Academic;
using examxy.Infrastructure.Email;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace examxy.Infrastructure.Identity.Services
{
    public class AccountService : IAccountService
    {
        private readonly IEmailSender _emailSender;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _dbContext;
        private readonly AppUrlOptions _appUrlOptions;

        public AccountService(
            IEmailSender emailSender,
            UserManager<ApplicationUser> userManager,
            AppDbContext dbContext,
            IOptions<AppUrlOptions> appUrlOptions)
        {
            _emailSender = emailSender;
            _userManager = userManager;
            _dbContext = dbContext;
            _appUrlOptions = appUrlOptions.Value;
        }

        public async Task<CurrentUserDto> GetCurrentUserAsync(
            string userId,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.Users
                .FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);

            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }

            var roles = await _userManager.GetRolesAsync(user);

            return new CurrentUserDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                EmailConfirmed = user.EmailConfirmed,
                PrimaryRole = examxy.Application.Abstractions.Identity.IdentityRoles.GetPrimaryRole(roles),
                Roles = roles.ToArray()
            };
        }

        public async Task ChangePasswordAsync(
            string userId,
            ChangePasswordRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.Users
                .Include(candidate => candidate.RefreshTokens)
                .FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);

            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }

            var changePasswordResult = await _userManager.ChangePasswordAsync(
                user,
                request.CurrentPassword,
                request.NewPassword);

            if (!changePasswordResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(changePasswordResult.Errors);
            }

            foreach (var refreshToken in user.RefreshTokens.Where(rt => rt.IsActive))
            {
                refreshToken.RevokedAtUtc = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task ForgotPasswordAsync(
            ForgotPasswordRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            if (user is null || !user.EmailConfirmed)
            {
                return;
            }

            var resetPasswordToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken = EmailTokenCodec.Encode(resetPasswordToken);
            var resetPasswordUrl = QueryHelpers.AddQueryString(
                BuildFrontendUrl(_appUrlOptions.ResetPasswordPath),
                new Dictionary<string, string?>
                {
                    ["email"] = user.Email,
                    ["token"] = encodedToken
                });

            await _emailSender.SendAsync(
                AuthEmailTemplateFactory.CreatePasswordResetMessage(
                    user.Email ?? string.Empty,
                    "Examxy",
                    resetPasswordUrl),
                cancellationToken);
        }

        public async Task ResetPasswordAsync(
            ResetPasswordRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.Users
                .Include(candidate => candidate.StudentProfile)
                .FirstOrDefaultAsync(candidate => candidate.Email == request.Email, cancellationToken);

            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }

            var resetPasswordResult = await _userManager.ResetPasswordAsync(
                user,
                EmailTokenCodec.Decode(request.Token),
                request.NewPassword);

            if (!resetPasswordResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(resetPasswordResult.Errors);
            }

            var activeRefreshTokens = await _dbContext.RefreshTokens
                .Where(rt => rt.UserId == user.Id &&
                             rt.RevokedAtUtc == null &&
                             rt.ExpiresAtUtc > DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            foreach (var refreshToken in activeRefreshTokens)
            {
                refreshToken.RevokedAtUtc = DateTime.UtcNow;
            }

            if (user.StudentProfile is not null &&
                user.StudentProfile.OnboardingState == StudentOnboardingState.Invited)
            {
                user.StudentProfile.OnboardingState = StudentOnboardingState.Active;
            }

            user.LastActivatedAtUtc = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task ConfirmEmailAsync(
            ConfirmEmailRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }

            var confirmEmailResult = await _userManager.ConfirmEmailAsync(
                user,
                EmailTokenCodec.Decode(request.Token));
            if (!confirmEmailResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(confirmEmailResult.Errors);
            }
        }

        public async Task ResendEmailConfirmationAsync(
            ResendEmailConfirmationRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            if (user is null || user.EmailConfirmed)
            {
                return;
            }

            var emailConfirmationToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = EmailTokenCodec.Encode(emailConfirmationToken);
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
