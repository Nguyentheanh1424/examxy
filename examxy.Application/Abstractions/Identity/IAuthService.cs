using examxy.Application.Abstractions.Identity.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace examxy.Application.Abstractions.Identity
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(
            RegisterRequestDto request,
            CancellationToken cancellationToken = default);

        Task<AuthResponseDto> LoginAsync(
            LoginRequestDto request,
            CancellationToken cancellationToken = default);

        Task<AuthResponseDto> RefreshTokenAsync(
            RefreshTokenRequestDto request,
            CancellationToken cancellationToken = default);

        Task LogoutAsync(
            string userId,
            LogoutRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
