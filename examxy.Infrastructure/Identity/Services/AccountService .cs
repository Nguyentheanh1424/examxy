using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace examxy.Infrastructure.Identity.Services
{
    public class AccountService : IAccountService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _dbContext;

        public AccountService(
            UserManager<ApplicationUser> userManager,
            AppDbContext dbContext)
        {
            _userManager = userManager;
            _dbContext = dbContext;
        }

        public async Task<CurrentUserDto?> GetCurrentUserAsync(
            string userId,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
            {
                return null;
            }

            var roles = await _userManager.GetRolesAsync(user);

            return new CurrentUserDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                EmailConfirmed = user.EmailConfirmed,
                Roles = roles.ToArray()
            };
        }

        public async Task ChangePasswordAsync(
            string userId,
            ChangePasswordRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var changePasswordResult = await _userManager.ChangePasswordAsync(
                user,
                request.CurrentPassword,
                request.NewPassword);

            if (!changePasswordResult.Succeeded)
            {
                throw new InvalidOperationException(
                    BuildIdentityErrorMessage(changePasswordResult.Errors));
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

            _ = resetPasswordToken;
            await Task.CompletedTask;

            // TODO:
            // Inject IEmailSender later and send reset password email here.
        }

        public async Task ResetPasswordAsync(
            ResetPasswordRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var resetPasswordResult = await _userManager.ResetPasswordAsync(
                user,
                request.Token,
                request.NewPassword);

            if (!resetPasswordResult.Succeeded)
            {
                throw new InvalidOperationException(
                    BuildIdentityErrorMessage(resetPasswordResult.Errors));
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

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task ConfirmEmailAsync(
            ConfirmEmailRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user is null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var confirmEmailResult = await _userManager.ConfirmEmailAsync(user, request.Token);
            if (!confirmEmailResult.Succeeded)
            {
                throw new InvalidOperationException(
                    BuildIdentityErrorMessage(confirmEmailResult.Errors));
            }

            await Task.CompletedTask;
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

            _ = emailConfirmationToken;
            await Task.CompletedTask;

            // TODO:
            // Inject IEmailSender later and send email confirmation here.
        }

        private static string BuildIdentityErrorMessage(IEnumerable<IdentityError> errors)
        {
            return string.Join("; ", errors.Select(e => e.Description));
        }
    }
}
