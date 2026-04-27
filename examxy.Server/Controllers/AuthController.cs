using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Application.Features.Classrooms;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace examxy.Server.Controllers
{
    /// <summary>
    /// Public authentication and account lifecycle endpoints.
    /// </summary>
    /// <remarks>
    /// These endpoints cover teacher registration, student self-signup, login, session refresh,
    /// logout, current-user lookups, password recovery, and email confirmation.
    /// See the flow diagrams in docs for the multi-step onboarding and recovery sequences.
    /// </remarks>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IAccountService _accountService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IStudentOnboardingService _studentOnboardingService;

        public AuthController(
            IAuthService authService,
            IAccountService accountService,
            ICurrentUserService currentUserService,
            IStudentOnboardingService studentOnboardingService)
        {
            _authService = authService;
            _accountService = accountService;
            _currentUserService = currentUserService;
            _studentOnboardingService = studentOnboardingService;
        }

        /// <summary>
        /// Register a new teacher account and start the authentication session immediately.
        /// </summary>
        /// <remarks>
        /// Flow: public teacher signup -&gt; create account with the Teacher role -&gt; create TeacherProfile
        /// -&gt; send email confirmation -&gt; return a token pair with <c>primaryRole = Teacher</c>.
        /// The account is created as unconfirmed, so later login attempts are blocked until
        /// the email confirmation flow completes.
        /// </remarks>
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuthResponseDto>> Register(
            [FromBody] RegisterRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _authService.RegisterAsync(request, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Register a new student account and direct the user into the student onboarding flow.
        /// </summary>
        /// <remarks>
        /// Flow: public student signup -&gt; create account with the Student role -&gt; create StudentProfile
        /// -&gt; return a token pair with <c>primaryRole = Student</c> -&gt; the client loads the student dashboard.
        /// Students can later claim class invites from the dashboard by submitting an invite code.
        /// </remarks>
        [HttpPost("register/student")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult<AuthResponseDto>> RegisterStudent(
            [FromBody] StudentRegisterRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _studentOnboardingService.RegisterStudentAsync(request, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Authenticate a confirmed user with a username or email and return a fresh token pair.
        /// </summary>
        /// <remarks>
        /// Flow: existing account login -&gt; validate credentials -&gt; reject unconfirmed accounts
        /// -&gt; update last activation timestamp -&gt; issue access token, refresh token, and <c>primaryRole</c>.
        /// Clients use <c>primaryRole</c> to redirect the user to the correct dashboard.
        /// </remarks>
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<AuthResponseDto>> Login(
            [FromBody] LoginRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _authService.LoginAsync(request, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Exchange an access token and refresh token for a new token pair.
        /// </summary>
        /// <remarks>
        /// Flow: client notices the access token is expiring or expired -&gt; submits the stored token pair
        /// -&gt; the current refresh token is validated and revoked -&gt; a fresh access token and refresh token are returned.
        /// </remarks>
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken(
            [FromBody] RefreshTokenRequestDto request,
            CancellationToken cancellationToken)
        {
            var response = await _authService.RefreshTokenAsync(request, cancellationToken);
            return Ok(response);
        }

        /// <summary>
        /// Revoke the submitted refresh token for the authenticated user and end the current session.
        /// </summary>
        /// <remarks>
        /// Flow: authenticated client sends the bearer token plus the refresh token it wants to invalidate
        /// -&gt; the server verifies token ownership -&gt; the matching refresh token is revoked -&gt; no content is returned.
        /// </remarks>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> Logout(
            [FromBody] LogoutRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            await _authService.LogoutAsync(
                _currentUserService.UserId,
                request,
                cancellationToken);

            return NoContent();
        }

        /// <summary>
        /// Return the current authenticated user's identity profile.
        /// </summary>
        /// <remarks>
        /// This endpoint is typically called during app bootstrap after a token has been restored or refreshed.
        /// It returns the user's current role data, confirmation state, and profile fields used to hydrate the UI.
        /// </remarks>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(CurrentUserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CurrentUserDto>> Me(
            CancellationToken cancellationToken)
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            var currentUser = await _accountService.GetCurrentUserAsync(
                _currentUserService.UserId,
                cancellationToken);

            return Ok(currentUser);
        }

        /// <summary>
        /// Change the current authenticated user's password.
        /// </summary>
        /// <remarks>
        /// Flow: authenticated user submits the current password and a replacement password -&gt;
        /// credentials are updated -&gt; the client should sign out locally and require a fresh login.
        /// </remarks>
        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangePasswordRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!_currentUserService.IsAuthenticated || string.IsNullOrWhiteSpace(_currentUserService.UserId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            await _accountService.ChangePasswordAsync(
                _currentUserService.UserId,
                request,
                cancellationToken);

            return NoContent();
        }

        /// <summary>
        /// Start the password reset flow for a confirmed account without revealing account existence.
        /// </summary>
        /// <remarks>
        /// Flow: the client submits an email address -&gt; if the account exists and is confirmed,
        /// a reset email is sent -&gt; the endpoint still returns <c>204</c> for privacy-safe behavior.
        /// The next step in the flow is <c>POST /api/auth/reset-password</c> after the user opens the emailed link.
        /// </remarks>
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ForgotPassword(
            [FromBody] ForgotPasswordRequestDto request,
            CancellationToken cancellationToken)
        {
            await _accountService.ForgotPasswordAsync(request, cancellationToken);
            return NoContent();
        }

        /// <summary>
        /// Complete the password reset flow with the URL-safe token sent by email.
        /// </summary>
        /// <remarks>
        /// Flow: the user receives the reset email -&gt; the client collects the <c>email</c> and <c>token</c>
        /// from the reset link -&gt; this endpoint validates the token and saves the new password.
        /// The token is expected to be the URL-encoded value carried by the frontend link.
        /// </remarks>
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ResetPassword(
            [FromBody] ResetPasswordRequestDto request,
            CancellationToken cancellationToken)
        {
            await _accountService.ResetPasswordAsync(request, cancellationToken);
            return NoContent();
        }

        /// <summary>
        /// Confirm an email address by validating the URL-safe token from the confirmation email.
        /// </summary>
        /// <remarks>
        /// Flow: registration sends the confirmation link -&gt; the client extracts <c>userId</c> and <c>token</c>
        /// from the link -&gt; this endpoint validates the token and marks the account as confirmed.
        /// After a successful confirmation, normal login is no longer blocked by the email-confirmed check.
        /// </remarks>
        [HttpPost("confirm-email")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ConfirmEmail(
            [FromBody] ConfirmEmailRequestDto request,
            CancellationToken cancellationToken)
        {
            await _accountService.ConfirmEmailAsync(request, cancellationToken);
            return NoContent();
        }

        /// <summary>
        /// Re-send the confirmation email for an existing unconfirmed account.
        /// </summary>
        /// <remarks>
        /// Flow: the user cannot log in because the email is still unconfirmed -&gt; the client calls this endpoint
        /// with the email address -&gt; if the account exists and is still unconfirmed, a fresh confirmation email is sent.
        /// The endpoint stays privacy-safe and returns <c>204</c> even when no email is sent.
        /// </remarks>
        [HttpPost("resend-email-confirmation")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResendEmailConfirmation(
            [FromBody] ResendEmailConfirmationRequestDto request,
            CancellationToken cancellationToken)
        {
            await _accountService.ResendEmailConfirmationAsync(request, cancellationToken);
            return NoContent();
        }
    }
}
