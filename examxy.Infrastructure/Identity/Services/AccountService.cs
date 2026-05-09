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

namespace examxy.Infrastructure.Identity.Services
{
    public class AccountService : IAccountService
    {
        private const int MaxAvatarSizeBytes = 2 * 1024 * 1024;
        private static readonly string[] AllowedAvatarContentTypes =
        {
            "image/png",
            "image/jpeg"
        };

        private static readonly AccountNotificationPreferenceDto[] DefaultNotificationPreferences =
        {
            new()
            {
                Id = "email-class-activity",
                Label = "Hoạt động lớp (bài đăng, bình luận)",
                Channel = "Email",
                Enabled = true
            },
            new()
            {
                Id = "email-assessments",
                Label = "Bài đánh giá mới & kết quả",
                Channel = "Email",
                Enabled = true
            },
            new()
            {
                Id = "email-invites",
                Label = "Lời mời vào lớp",
                Channel = "Email",
                Enabled = true
            },
            new()
            {
                Id = "email-weekly-summary",
                Label = "Bản tóm tắt hằng tuần",
                Channel = "Email",
                Enabled = true
            },
            new()
            {
                Id = "in-app-class-activity",
                Label = "Hoạt động lớp",
                Channel = "InApp",
                Enabled = true
            },
            new()
            {
                Id = "in-app-assessments",
                Label = "Bài đánh giá",
                Channel = "InApp",
                Enabled = true
            },
            new()
            {
                Id = "in-app-mentions",
                Label = "Khi có người nhắc tên (@)",
                Channel = "InApp",
                Enabled = true
            }
        };

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

            return MapCurrentUser(user, roles);
        }

        public async Task<AccountProfileDto> GetProfileAsync(
            string userId,
            CancellationToken cancellationToken = default)
        {
            var user = await GetUserAsync(userId, cancellationToken);
            var roles = await _userManager.GetRolesAsync(user);

            return MapProfile(user, roles);
        }

        public async Task<AccountProfileDto> UpdateProfileAsync(
            string userId,
            UpdateAccountProfileRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await GetUserAsync(userId, cancellationToken);

            var trimmedFullName = (request.FullName ?? string.Empty).Trim();
            var trimmedPhoneNumber = (request.PhoneNumber ?? string.Empty).Trim();
            var trimmedTimeZone = (request.TimeZoneId ?? string.Empty).Trim();
            var trimmedBio = (request.Bio ?? string.Empty).Trim();

            var errors = new Dictionary<string, string[]>();
            if (string.IsNullOrWhiteSpace(trimmedFullName))
            {
                errors["fullName"] = new[] { "Full name is required." };
            }

            if (trimmedFullName.Length > 120)
            {
                errors["fullName"] = new[] { "Full name must be 120 characters or fewer." };
            }

            if (trimmedPhoneNumber.Length > 32)
            {
                errors["phoneNumber"] = new[] { "Phone number must be 32 characters or fewer." };
            }

            if (string.IsNullOrWhiteSpace(trimmedTimeZone) || trimmedTimeZone.Length > 80)
            {
                errors["timeZoneId"] = new[] { "Time zone is invalid." };
            }

            if (trimmedBio.Length > 200)
            {
                errors["bio"] = new[] { "Bio must be 200 characters or fewer." };
            }

            if (errors.Count > 0)
            {
                throw new ValidationException("Account profile is invalid.", errors);
            }

            user.FullName = trimmedFullName;
            user.PhoneNumber = string.IsNullOrWhiteSpace(trimmedPhoneNumber) ? null : trimmedPhoneNumber;
            user.TimeZoneId = trimmedTimeZone;
            user.Bio = trimmedBio;

            await _dbContext.SaveChangesAsync(cancellationToken);

            var roles = await _userManager.GetRolesAsync(user);
            return MapProfile(user, roles);
        }

        public async Task<AccountProfileDto> UpdateAvatarAsync(
            string userId,
            UpdateAccountAvatarRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await GetUserAsync(userId, cancellationToken);
            ValidateAvatar(request);

            user.AvatarFileName = string.IsNullOrWhiteSpace(request.FileName)
                ? "avatar"
                : Path.GetFileName(request.FileName);
            user.AvatarContentType = request.ContentType;
            user.AvatarContent = request.Content;

            await _dbContext.SaveChangesAsync(cancellationToken);

            var roles = await _userManager.GetRolesAsync(user);
            return MapProfile(user, roles);
        }

        public async Task<AccountAvatarDto> GetAvatarAsync(
            string userId,
            CancellationToken cancellationToken = default)
        {
            var user = await GetUserAsync(userId, cancellationToken);

            if (user.AvatarContent is null ||
                user.AvatarContent.Length == 0 ||
                string.IsNullOrWhiteSpace(user.AvatarContentType))
            {
                throw new NotFoundException("Avatar not found.");
            }

            return new AccountAvatarDto
            {
                FileName = string.IsNullOrWhiteSpace(user.AvatarFileName)
                    ? "avatar"
                    : user.AvatarFileName,
                ContentType = user.AvatarContentType,
                Content = user.AvatarContent
            };
        }

        public async Task DeleteAvatarAsync(
            string userId,
            CancellationToken cancellationToken = default)
        {
            var user = await GetUserAsync(userId, cancellationToken);

            user.AvatarFileName = null;
            user.AvatarContentType = null;
            user.AvatarContent = null;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task<IReadOnlyCollection<AccountSessionDto>> GetSessionsAsync(
            string userId,
            string? currentSessionId,
            CancellationToken cancellationToken = default)
        {
            await EnsureUserExistsAsync(userId, cancellationToken);

            var tokens = await _dbContext.RefreshTokens
                .Where(token => token.UserId == userId)
                .OrderByDescending(token => token.LastUsedAtUtc)
                .Take(20)
                .ToArrayAsync(cancellationToken);

            var now = DateTime.UtcNow;
            var currentSession = ResolveCurrentSessionId(tokens, currentSessionId, now);

            var sessions = tokens
                .Select(token => new AccountSessionDto
                {
                    Id = token.SessionId,
                    Device = string.IsNullOrWhiteSpace(token.Device) ? "Web browser" : token.Device,
                    Browser = string.IsNullOrWhiteSpace(token.Browser) ? "Unknown browser" : token.Browser,
                    Location = string.IsNullOrWhiteSpace(token.Location) ? "Unknown location" : token.Location,
                    IpAddress = string.IsNullOrWhiteSpace(token.IpAddressMasked) ? "Unknown IP" : token.IpAddressMasked,
                    CreatedAtUtc = token.CreatedAtUtc,
                    LastActiveAtUtc = token.LastUsedAtUtc,
                    ExpiresAtUtc = token.ExpiresAtUtc,
                    IsCurrent = token.SessionId == currentSession,
                    IsRevoked = token.RevokedAtUtc != null || token.ExpiresAtUtc <= now,
                    DeviceType = string.IsNullOrWhiteSpace(token.DeviceType) ? "Laptop" : token.DeviceType
                })
                .ToArray();

            return sessions;
        }

        public async Task RevokeSessionAsync(
            string userId,
            Guid sessionId,
            string? currentSessionId,
            CancellationToken cancellationToken = default)
        {
            if (string.Equals(sessionId.ToString(), currentSessionId, StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException(
                    "The current session cannot be revoked from this endpoint.",
                    new Dictionary<string, string[]>
                    {
                        ["sessionId"] = new[] { "Use the sign-out flow for the current session." }
                    });
            }

            var tokens = await _dbContext.RefreshTokens
                .Where(token => token.UserId == userId && token.SessionId == sessionId)
                .ToArrayAsync(cancellationToken);

            if (tokens.Length == 0)
            {
                throw new NotFoundException("Session not found.");
            }

            foreach (var token in tokens.Where(token => token.IsActive))
            {
                token.RevokedAtUtc = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task RevokeOtherSessionsAsync(
            string userId,
            string? currentSessionId,
            CancellationToken cancellationToken = default)
        {
            var activeTokens = await _dbContext.RefreshTokens
                .Where(token => token.UserId == userId &&
                                token.RevokedAtUtc == null &&
                                token.ExpiresAtUtc > DateTime.UtcNow)
                .ToArrayAsync(cancellationToken);

            foreach (var token in activeTokens)
            {
                if (!string.Equals(token.SessionId.ToString(), currentSessionId, StringComparison.OrdinalIgnoreCase))
                {
                    token.RevokedAtUtc = DateTime.UtcNow;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        private static Guid? ResolveCurrentSessionId(
            IReadOnlyCollection<RefreshToken> tokens,
            string? currentSessionId,
            DateTime now)
        {
            if (Guid.TryParse(currentSessionId, out var parsedSessionId))
            {
                return parsedSessionId;
            }

            return tokens
                .Where(token => token.RevokedAtUtc == null && token.ExpiresAtUtc > now)
                .OrderByDescending(token => token.LastUsedAtUtc)
                .Select(token => (Guid?)token.SessionId)
                .FirstOrDefault();
        }

        public async Task<IReadOnlyCollection<AccountNotificationPreferenceDto>> GetNotificationPreferencesAsync(
            string userId,
            CancellationToken cancellationToken = default)
        {
            await EnsureDefaultNotificationPreferencesAsync(userId, cancellationToken);

            return await _dbContext.AccountNotificationPreferences
                .Where(preference => preference.UserId == userId)
                .OrderBy(preference => preference.PreferenceKey)
                .Select(preference => new AccountNotificationPreferenceDto
                {
                    Id = preference.PreferenceKey,
                    Label = preference.Label,
                    Channel = preference.Channel,
                    Enabled = preference.Enabled
                })
                .ToArrayAsync(cancellationToken);
        }

        public async Task<IReadOnlyCollection<AccountNotificationPreferenceDto>> UpdateNotificationPreferencesAsync(
            string userId,
            UpdateAccountNotificationPreferencesRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureDefaultNotificationPreferencesAsync(userId, cancellationToken);

            var existing = await _dbContext.AccountNotificationPreferences
                .Where(preference => preference.UserId == userId)
                .ToDictionaryAsync(preference => preference.PreferenceKey, cancellationToken);

            var knownPreferences = DefaultNotificationPreferences.ToDictionary(
                preference => preference.Id,
                StringComparer.Ordinal);

            foreach (var requestPreference in request.Preferences)
            {
                if (!knownPreferences.TryGetValue(requestPreference.Id, out var knownPreference))
                {
                    throw new ValidationException(
                        "Notification preference is invalid.",
                        new Dictionary<string, string[]>
                        {
                            ["preferences"] = new[] { $"Unknown preference '{requestPreference.Id}'." }
                        });
                }

                var entity = existing[requestPreference.Id];
                entity.Label = knownPreference.Label;
                entity.Channel = knownPreference.Channel;
                entity.Enabled = requestPreference.Enabled;
                entity.UpdatedAtUtc = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return await GetNotificationPreferencesAsync(userId, cancellationToken);
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

        private async Task EnsureUserExistsAsync(
            string userId,
            CancellationToken cancellationToken)
        {
            var exists = await _userManager.Users
                .AnyAsync(candidate => candidate.Id == userId, cancellationToken);

            if (!exists)
            {
                throw new NotFoundException("User not found.");
            }
        }

        private async Task EnsureDefaultNotificationPreferencesAsync(
            string userId,
            CancellationToken cancellationToken)
        {
            await EnsureUserExistsAsync(userId, cancellationToken);

            var existingKeys = await _dbContext.AccountNotificationPreferences
                .Where(preference => preference.UserId == userId)
                .Select(preference => preference.PreferenceKey)
                .ToArrayAsync(cancellationToken);

            var existingSet = existingKeys.ToHashSet(StringComparer.Ordinal);
            var existingPreferences = await _dbContext.AccountNotificationPreferences
                .Where(preference => preference.UserId == userId)
                .ToDictionaryAsync(preference => preference.PreferenceKey, cancellationToken);

            foreach (var preference in DefaultNotificationPreferences)
            {
                if (existingSet.Contains(preference.Id))
                {
                    var entity = existingPreferences[preference.Id];
                    entity.Label = preference.Label;
                    entity.Channel = preference.Channel;
                    continue;
                }

                _dbContext.AccountNotificationPreferences.Add(new AccountNotificationPreference
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    PreferenceKey = preference.Id,
                    Label = preference.Label,
                    Channel = preference.Channel,
                    Enabled = preference.Enabled,
                    UpdatedAtUtc = DateTime.UtcNow
                });
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        private async Task<ApplicationUser> GetUserAsync(
            string userId,
            CancellationToken cancellationToken)
        {
            var user = await _userManager.Users
                .FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);

            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }

            return user;
        }

        private static void ValidateAvatar(UpdateAccountAvatarRequestDto request)
        {
            var errors = new Dictionary<string, string[]>();
            if (request.Content.Length == 0)
            {
                errors["avatar"] = new[] { "Avatar image is required." };
            }
            else if (request.FileSizeBytes > MaxAvatarSizeBytes ||
                     request.Content.Length > MaxAvatarSizeBytes)
            {
                errors["avatar"] = new[] { "Avatar image must be 2MB or smaller." };
            }

            if (!AllowedAvatarContentTypes.Contains(request.ContentType, StringComparer.OrdinalIgnoreCase))
            {
                errors["avatar"] = new[] { "Avatar image must be PNG or JPG." };
            }

            var extension = Path.GetExtension(request.FileName);
            if (!string.Equals(extension, ".png", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(extension, ".jpg", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(extension, ".jpeg", StringComparison.OrdinalIgnoreCase))
            {
                errors["avatar"] = new[] { "Avatar image must use .png, .jpg, or .jpeg." };
            }

            if (errors.Count > 0)
            {
                throw new ValidationException("Avatar image is invalid.", errors);
            }
        }

        private static CurrentUserDto MapCurrentUser(
            ApplicationUser user,
            IEnumerable<string> roles)
        {
            return new CurrentUserDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                TimeZoneId = string.IsNullOrWhiteSpace(user.TimeZoneId)
                    ? "Asia/Ho_Chi_Minh"
                    : user.TimeZoneId,
                Bio = user.Bio,
                AvatarUrl = GetAvatarUrl(user),
                AvatarDataUrl = GetAvatarDataUrl(user),
                EmailConfirmed = user.EmailConfirmed,
                PrimaryRole = examxy.Application.Abstractions.Identity.IdentityRoles.GetPrimaryRole(roles),
                Roles = roles.ToArray()
            };
        }

        private static AccountProfileDto MapProfile(
            ApplicationUser user,
            IEnumerable<string> roles)
        {
            return new AccountProfileDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                EmailConfirmed = user.EmailConfirmed,
                PrimaryRole = examxy.Application.Abstractions.Identity.IdentityRoles.GetPrimaryRole(roles),
                Roles = roles.ToArray(),
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                TimeZoneId = string.IsNullOrWhiteSpace(user.TimeZoneId)
                    ? "Asia/Ho_Chi_Minh"
                    : user.TimeZoneId,
                Bio = user.Bio,
                AvatarUrl = GetAvatarUrl(user),
                AvatarDataUrl = GetAvatarDataUrl(user)
            };
        }

        private static string? GetAvatarUrl(ApplicationUser user)
        {
            return user.AvatarContent is { Length: > 0 }
                ? "/api/account/profile/avatar"
                : null;
        }

        private static string? GetAvatarDataUrl(ApplicationUser user)
        {
            return user.AvatarContent is { Length: > 0 } &&
                   !string.IsNullOrWhiteSpace(user.AvatarContentType)
                ? $"data:{user.AvatarContentType};base64,{Convert.ToBase64String(user.AvatarContent)}"
                : null;
        }
    }
}
