using examxy.Application.Abstractions.Identity.DTOs;
namespace examxy.Application.Abstractions.Identity
{
    public interface IAccountService
    {
        Task<CurrentUserDto> GetCurrentUserAsync(
            string userId,
            CancellationToken cancellationToken = default);

        Task<AccountProfileDto> GetProfileAsync(
            string userId,
            CancellationToken cancellationToken = default);

        Task<AccountProfileDto> UpdateProfileAsync(
            string userId,
            UpdateAccountProfileRequestDto request,
            CancellationToken cancellationToken = default);

        Task<AccountProfileDto> UpdateAvatarAsync(
            string userId,
            UpdateAccountAvatarRequestDto request,
            CancellationToken cancellationToken = default);

        Task<AccountAvatarDto> GetAvatarAsync(
            string userId,
            CancellationToken cancellationToken = default);

        Task DeleteAvatarAsync(
            string userId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<AccountSessionDto>> GetSessionsAsync(
            string userId,
            string? currentSessionId,
            CancellationToken cancellationToken = default);

        Task RevokeSessionAsync(
            string userId,
            Guid sessionId,
            string? currentSessionId,
            CancellationToken cancellationToken = default);

        Task RevokeOtherSessionsAsync(
            string userId,
            string? currentSessionId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<AccountNotificationPreferenceDto>> GetNotificationPreferencesAsync(
            string userId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<AccountNotificationPreferenceDto>> UpdateNotificationPreferencesAsync(
            string userId,
            UpdateAccountNotificationPreferencesRequestDto request,
            CancellationToken cancellationToken = default);

        Task ChangePasswordAsync(
            string userId,
            ChangePasswordRequestDto request,
            CancellationToken cancellationToken = default);

        Task ForgotPasswordAsync(
            ForgotPasswordRequestDto request,
            CancellationToken cancellationToken = default);

        Task ResetPasswordAsync(
            ResetPasswordRequestDto request,
            CancellationToken cancellationToken = default);

        Task ConfirmEmailAsync(
            ConfirmEmailRequestDto request,
            CancellationToken cancellationToken = default);

        Task ResendEmailConfirmationAsync(
            ResendEmailConfirmationRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
