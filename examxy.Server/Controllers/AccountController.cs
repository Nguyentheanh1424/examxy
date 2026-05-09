using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    /// <summary>
    /// Browser-safe account settings endpoints for authenticated users.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/account")]
    public sealed class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly ICurrentUserService _currentUserService;

        public AccountController(
            IAccountService accountService,
            ICurrentUserService currentUserService)
        {
            _accountService = accountService;
            _currentUserService = currentUserService;
        }

        [HttpGet("profile")]
        [ProducesResponseType(typeof(AccountProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AccountProfileDto>> GetProfile(
            CancellationToken cancellationToken)
        {
            var response = await _accountService.GetProfileAsync(
                GetRequiredUserId(),
                cancellationToken);

            return Ok(response);
        }

        [HttpPut("profile")]
        [ProducesResponseType(typeof(AccountProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AccountProfileDto>> UpdateProfile(
            [FromBody] UpdateAccountProfileRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _accountService.UpdateProfileAsync(
                GetRequiredUserId(),
                request,
                cancellationToken);

            return Ok(response);
        }

        [HttpGet("profile/avatar")]
        [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAvatar(CancellationToken cancellationToken)
        {
            var avatar = await _accountService.GetAvatarAsync(
                GetRequiredUserId(),
                cancellationToken);

            return File(avatar.Content, avatar.ContentType, avatar.FileName);
        }

        [HttpPost("profile/avatar")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(AccountProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AccountProfileDto>> UpdateAvatar(
            IFormFile? avatar,
            CancellationToken cancellationToken)
        {
            if (avatar is null)
            {
                throw new ValidationException(
                    "Avatar image is required.",
                    new Dictionary<string, string[]>
                    {
                        ["avatar"] = new[] { "Choose a PNG or JPG image." }
                    });
            }

            using var memoryStream = new MemoryStream();
            await avatar.CopyToAsync(memoryStream, cancellationToken);

            var response = await _accountService.UpdateAvatarAsync(
                GetRequiredUserId(),
                new UpdateAccountAvatarRequestDto
                {
                    FileName = avatar.FileName,
                    ContentType = avatar.ContentType,
                    FileSizeBytes = avatar.Length,
                    Content = memoryStream.ToArray()
                },
                cancellationToken);

            return Ok(response);
        }

        [HttpDelete("profile/avatar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> DeleteAvatar(CancellationToken cancellationToken)
        {
            await _accountService.DeleteAvatarAsync(
                GetRequiredUserId(),
                cancellationToken);

            return NoContent();
        }

        [HttpGet("sessions")]
        [ProducesResponseType(typeof(IReadOnlyCollection<AccountSessionDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IReadOnlyCollection<AccountSessionDto>>> GetSessions(
            CancellationToken cancellationToken)
        {
            var response = await _accountService.GetSessionsAsync(
                GetRequiredUserId(),
                _currentUserService.SessionId,
                cancellationToken);

            return Ok(response);
        }

        [HttpDelete("sessions/{sessionId:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RevokeSession(
            Guid sessionId,
            CancellationToken cancellationToken)
        {
            await _accountService.RevokeSessionAsync(
                GetRequiredUserId(),
                sessionId,
                _currentUserService.SessionId,
                cancellationToken);

            return NoContent();
        }

        [HttpDelete("sessions")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RevokeOtherSessions(
            CancellationToken cancellationToken)
        {
            await _accountService.RevokeOtherSessionsAsync(
                GetRequiredUserId(),
                _currentUserService.SessionId,
                cancellationToken);

            return NoContent();
        }

        [HttpGet("notification-preferences")]
        [ProducesResponseType(typeof(IReadOnlyCollection<AccountNotificationPreferenceDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IReadOnlyCollection<AccountNotificationPreferenceDto>>> GetNotificationPreferences(
            CancellationToken cancellationToken)
        {
            var response = await _accountService.GetNotificationPreferencesAsync(
                GetRequiredUserId(),
                cancellationToken);

            return Ok(response);
        }

        [HttpPut("notification-preferences")]
        [ProducesResponseType(typeof(IReadOnlyCollection<AccountNotificationPreferenceDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IReadOnlyCollection<AccountNotificationPreferenceDto>>> UpdateNotificationPreferences(
            [FromBody] UpdateAccountNotificationPreferencesRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _accountService.UpdateNotificationPreferencesAsync(
                GetRequiredUserId(),
                request,
                cancellationToken);

            return Ok(response);
        }

        private string GetRequiredUserId()
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            return _currentUserService.UserId;
        }
    }
}
