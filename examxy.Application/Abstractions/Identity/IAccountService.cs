using examxy.Application.Abstractions.Identity.DTOs;
namespace examxy.Application.Abstractions.Identity
{
    public interface IAccountService
    {
        Task<CurrentUserDto> GetCurrentUserAsync(
            string userId,
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
