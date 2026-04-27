using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Text.Json;
using examxy.Application.Abstractions.Email;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Infrastructure.Identity;
using examxy.Server.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;

namespace test.Integration.Auth
{
    public sealed class AuthApiTests : IClassFixture<AuthApiFactory>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AuthApiFactory _factory;
        private readonly HttpClient _client;

        public AuthApiTests(AuthApiFactory factory)
        {
            _factory = factory;
            _factory.EmailSender.Clear();
            _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task Register_ReturnsTokensAndSendsConfirmationEmail()
        {
            var request = CreateRegisterRequest();

            var response = await _client.PostAsJsonAsync("/api/auth/register", request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.Equal(request.UserName, payload!.UserName);
            Assert.Equal(request.Email, payload.Email);
            Assert.NotEmpty(payload.AccessToken);
            Assert.NotEmpty(payload.RefreshToken);
            Assert.Equal("Teacher", payload.PrimaryRole);
            Assert.Contains("Teacher", payload.Roles);

            var user = await FindUserByEmailAsync(request.Email);
            Assert.NotNull(user);
            Assert.False(user!.EmailConfirmed);

            var sentEmail = Assert.Single(_factory.EmailSender.GetMessages());
            Assert.Equal(request.Email, sentEmail.To);
            Assert.Equal("Examxy: Confirm your email address", sentEmail.Subject);
            Assert.Contains("Finish setting up your account", sentEmail.TextBody);
            Assert.Contains("/confirm-email", sentEmail.TextBody);
            Assert.Contains("userId=", sentEmail.TextBody);
            Assert.Contains("token=", sentEmail.TextBody);
        }

        [Fact]
        public async Task Register_WithInvalidPayload_ReturnsValidationError()
        {
            var request = new RegisterRequestDto
            {
                UserName = "ab",
                Email = "not-an-email",
                Password = "123",
                ConfirmPassword = "456"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/register", request);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(error);
            Assert.Equal("validation_error", error!.Code);
            Assert.NotNull(error.Errors);
            Assert.NotEmpty(error.Errors!);
        }

        [Fact]
        public async Task Register_WithDuplicateUserName_ReturnsConflict()
        {
            var first = CreateRegisterRequest();
            var second = CreateRegisterRequest();
            second.UserName = first.UserName;

            await _client.PostAsJsonAsync("/api/auth/register", first);
            var response = await _client.PostAsJsonAsync("/api/auth/register", second);

            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

            var error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(error);
            Assert.Equal("conflict_error", error!.Code);
        }

        [Fact]
        public async Task Register_WithDuplicateEmail_ReturnsConflict()
        {
            var first = CreateRegisterRequest();
            var second = CreateRegisterRequest();
            second.Email = first.Email;

            await RegisterAsync(first);
            var response = await _client.PostAsJsonAsync("/api/auth/register", second);

            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

            var error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(error);
            Assert.Equal("conflict_error", error!.Code);
        }

        [Fact]
        public async Task Login_WithUnconfirmedEmail_ReturnsForbidden()
        {
            var request = CreateRegisterRequest();
            await RegisterAsync(request);

            var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = request.Email,
                Password = request.Password
            });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

            var error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(error);
            Assert.Equal("email_confirmation_required", error!.Code);
        }

        [Fact]
        public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
        {
            var request = CreateRegisterRequest();
            await RegisterAndConfirmAsync(request);

            var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = request.Email,
                Password = "WrongPass123"
            });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

            var error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(error);
            Assert.Equal("invalid_credentials", error!.Code);
        }

        [Fact]
        public async Task Login_AfterEmailConfirmation_ReturnsTokens()
        {
            var request = CreateRegisterRequest();
            await RegisterAndConfirmAsync(request);

            var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = request.UserName,
                Password = request.Password
            });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            Assert.NotEmpty(payload!.AccessToken);
            Assert.NotEmpty(payload.RefreshToken);
        }

        [Fact]
        public async Task Login_AfterMaxFailedAttempts_ReturnsForbidden()
        {
            var request = CreateRegisterRequest();
            await RegisterAndConfirmAsync(request);

            for (var attempt = 0; attempt < 5; attempt++)
            {
                await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
                {
                    UserNameOrEmail = request.UserName,
                    Password = "WrongPass123"
                });
            }

            var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = request.UserName,
                Password = request.Password
            });

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

            var error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(error);
            Assert.Equal("account_locked", error!.Code);
        }

        [Fact]
        public async Task RefreshToken_WithValidTokens_ReturnsNewTokenPair()
        {
            var request = CreateRegisterRequest();
            var auth = await RegisterAsync(request);

            var response = await _client.PostAsJsonAsync("/api/auth/refresh-token", new RefreshTokenRequestDto
            {
                AccessToken = auth.AccessToken,
                RefreshToken = auth.RefreshToken
            });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var refreshed = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(refreshed);
            Assert.NotEqual(auth.RefreshToken, refreshed!.RefreshToken);
            Assert.NotEmpty(refreshed.AccessToken);
        }

        [Fact]
        public async Task Logout_RevokesRefreshToken()
        {
            var request = CreateRegisterRequest();
            var auth = await RegisterAsync(request);

            using var logoutRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/auth/logout",
                auth.AccessToken,
                new LogoutRequestDto
                {
                    RefreshToken = auth.RefreshToken
                });

            var logoutResponse = await _client.SendAsync(logoutRequest);

            Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

            var refreshResponse = await _client.PostAsJsonAsync("/api/auth/refresh-token", new RefreshTokenRequestDto
            {
                AccessToken = auth.AccessToken,
                RefreshToken = auth.RefreshToken
            });

            Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
        }

        [Fact]
        public async Task Logout_WithoutAccessToken_ReturnsUnauthorized()
        {
            var request = CreateRegisterRequest();
            var auth = await RegisterAsync(request);

            var response = await _client.PostAsJsonAsync("/api/auth/logout", new LogoutRequestDto
            {
                RefreshToken = auth.RefreshToken
            });

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Logout_WithRefreshTokenFromDifferentUser_ReturnsForbidden()
        {
            var firstUser = await RegisterAsync(CreateRegisterRequest());
            var secondUser = await RegisterAsync(CreateRegisterRequest());

            using var logoutRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/auth/logout",
                firstUser.AccessToken,
                new LogoutRequestDto
                {
                    RefreshToken = secondUser.RefreshToken
                });

            var response = await _client.SendAsync(logoutRequest);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

            var error = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(JsonOptions);
            Assert.NotNull(error);
            Assert.Equal("forbidden", error!.Code);
        }

        [Fact]
        public async Task Me_WithBearerToken_ReturnsCurrentUser()
        {
            var request = CreateRegisterRequest();
            var auth = await RegisterAsync(request);

            using var message = CreateAuthenticatedRequest(HttpMethod.Get, "/api/auth/me", auth.AccessToken);
            var response = await _client.SendAsync(message);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var currentUser = await response.Content.ReadFromJsonAsync<CurrentUserDto>(JsonOptions);
            Assert.NotNull(currentUser);
            Assert.Equal(request.Email, currentUser!.Email);
            Assert.Equal(request.UserName, currentUser.UserName);
            Assert.False(currentUser.EmailConfirmed);
            Assert.Equal("Teacher", currentUser.PrimaryRole);
        }

        [Fact]
        public async Task ChangePassword_UpdatesPasswordAndRevokesOldRefreshToken()
        {
            var request = CreateRegisterRequest();
            var auth = await RegisterAsync(request);
            var newPassword = "NewPass123";

            using var changeRequest = CreateAuthenticatedRequest(
                HttpMethod.Post,
                "/api/auth/change-password",
                auth.AccessToken,
                new ChangePasswordRequestDto
                {
                    CurrentPassword = request.Password,
                    NewPassword = newPassword,
                    ConfirmNewPassword = newPassword
                });

            var changeResponse = await _client.SendAsync(changeRequest);
            Assert.Equal(HttpStatusCode.NoContent, changeResponse.StatusCode);

            await ConfirmUserByEmailAsync(request.Email);

            var oldLoginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = request.Email,
                Password = request.Password
            });
            Assert.Equal(HttpStatusCode.Unauthorized, oldLoginResponse.StatusCode);

            var newLoginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = request.Email,
                Password = newPassword
            });
            Assert.Equal(HttpStatusCode.OK, newLoginResponse.StatusCode);

            var refreshResponse = await _client.PostAsJsonAsync("/api/auth/refresh-token", new RefreshTokenRequestDto
            {
                AccessToken = auth.AccessToken,
                RefreshToken = auth.RefreshToken
            });
            Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
        }

        [Fact]
        public async Task ForgotPassword_WithUnknownEmail_ReturnsNoContent()
        {
            var response = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequestDto
            {
                Email = "unknown@example.test"
            });

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Empty(_factory.EmailSender.GetMessages());
        }

        [Fact]
        public async Task ForgotPassword_WithUnconfirmedEmail_ReturnsNoContentWithoutSendingEmail()
        {
            var request = CreateRegisterRequest();
            await RegisterAsync(request);
            _factory.EmailSender.Clear();

            var response = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequestDto
            {
                Email = request.Email
            });

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Empty(_factory.EmailSender.GetMessages());
        }

        [Fact]
        public async Task ForgotPassword_WithConfirmedEmail_SendsResetEmail()
        {
            var request = CreateRegisterRequest();
            await RegisterAndConfirmAsync(request);
            _factory.EmailSender.Clear();

            var response = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequestDto
            {
                Email = request.Email
            });

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            var sentEmail = Assert.Single(_factory.EmailSender.GetMessages());
            Assert.Equal(request.Email, sentEmail.To);
            Assert.Equal("Examxy: Reset your password", sentEmail.Subject);
            Assert.Contains("We received a request to reset your password", sentEmail.TextBody);
            Assert.Contains("/reset-password", sentEmail.TextBody);
            Assert.Contains("email=", sentEmail.TextBody);
            Assert.Contains("token=", sentEmail.TextBody);
        }

        [Fact]
        public async Task ResetPassword_WithValidEncodedToken_ResetsPassword()
        {
            var request = CreateRegisterRequest();
            await RegisterAndConfirmAsync(request);

            _factory.EmailSender.Clear();
            await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordRequestDto
            {
                Email = request.Email
            });

            var resetEmail = Assert.Single(_factory.EmailSender.GetMessages());
            var resetToken = ExtractQueryParameter(resetEmail.TextBody, "token");
            var newPassword = "ResetPass123";

            var resetResponse = await _client.PostAsJsonAsync("/api/auth/reset-password", new ResetPasswordRequestDto
            {
                Email = request.Email,
                Token = resetToken,
                NewPassword = newPassword,
                ConfirmNewPassword = newPassword
            });

            Assert.Equal(HttpStatusCode.NoContent, resetResponse.StatusCode);

            var oldLoginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = request.Email,
                Password = request.Password
            });
            Assert.Equal(HttpStatusCode.Unauthorized, oldLoginResponse.StatusCode);

            var newLoginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto
            {
                UserNameOrEmail = request.Email,
                Password = newPassword
            });
            Assert.Equal(HttpStatusCode.OK, newLoginResponse.StatusCode);
        }

        [Fact]
        public async Task ConfirmEmail_WithEncodedToken_ConfirmsUserEmail()
        {
            var request = CreateRegisterRequest();
            await RegisterAsync(request);

            var confirmationEmail = Assert.Single(_factory.EmailSender.GetMessages());
            var userId = ExtractQueryParameter(confirmationEmail.TextBody, "userId");
            var token = ExtractQueryParameter(confirmationEmail.TextBody, "token");

            var response = await _client.PostAsJsonAsync("/api/auth/confirm-email", new ConfirmEmailRequestDto
            {
                UserId = userId,
                Token = token
            });

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            var user = await FindUserByEmailAsync(request.Email);
            Assert.NotNull(user);
            Assert.True(user!.EmailConfirmed);
        }

        [Fact]
        public async Task ResendEmailConfirmation_WithUnconfirmedUser_SendsEmail()
        {
            var request = CreateRegisterRequest();
            await RegisterAsync(request);
            _factory.EmailSender.Clear();

            var response = await _client.PostAsJsonAsync("/api/auth/resend-email-confirmation", new ResendEmailConfirmationRequestDto
            {
                Email = request.Email
            });

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            var sentEmail = Assert.Single(_factory.EmailSender.GetMessages());
            Assert.Equal(request.Email, sentEmail.To);
            Assert.Equal("Examxy: Confirm your email address", sentEmail.Subject);
            Assert.Contains("/confirm-email", sentEmail.TextBody);
        }

        [Fact]
        public async Task ResendEmailConfirmation_WithConfirmedUser_ReturnsNoContentWithoutSendingEmail()
        {
            var request = CreateRegisterRequest();
            await RegisterAndConfirmAsync(request);
            _factory.EmailSender.Clear();

            var response = await _client.PostAsJsonAsync("/api/auth/resend-email-confirmation", new ResendEmailConfirmationRequestDto
            {
                Email = request.Email
            });

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
            Assert.Empty(_factory.EmailSender.GetMessages());
        }

        private async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
        {
            var response = await _client.PostAsJsonAsync("/api/auth/register", request);
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
            Assert.NotNull(payload);
            return payload!;
        }

        private async Task<AuthResponseDto> RegisterAndConfirmAsync(RegisterRequestDto request)
        {
            var auth = await RegisterAsync(request);
            await ConfirmUserByEmailAsync(request.Email);
            return auth;
        }

        private async Task ConfirmUserByEmailAsync(string email)
        {
            var user = await FindUserByEmailAsync(email);
            Assert.NotNull(user);

            if (user!.EmailConfirmed)
            {
                return;
            }

            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var refreshedUser = await userManager.FindByEmailAsync(email);
            Assert.NotNull(refreshedUser);

            refreshedUser!.EmailConfirmed = true;
            var result = await userManager.UpdateAsync(refreshedUser);
            Assert.True(result.Succeeded);
        }

        private async Task<ApplicationUser?> FindUserByEmailAsync(string email)
        {
            using var scope = _factory.Services.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            return await userManager.FindByEmailAsync(email);
        }

        private static RegisterRequestDto CreateRegisterRequest()
        {
            var suffix = Guid.NewGuid().ToString("N");

            return new RegisterRequestDto
            {
                UserName = $"user_{suffix}",
                Email = $"{suffix}@example.test",
                Password = "Pass123",
                ConfirmPassword = "Pass123"
            };
        }

        private static string ExtractQueryParameter(string? textBody, string key)
        {
            Assert.False(string.IsNullOrWhiteSpace(textBody));

            var match = Regex.Match(textBody!, @"https?://\S+");
            Assert.True(match.Success);

            var link = match.Value;
            var uri = new Uri(link);
            var query = QueryHelpers.ParseQuery(uri.Query);

            Assert.True(query.TryGetValue(key, out var value));
            return value.ToString();
        }

        private static HttpRequestMessage CreateAuthenticatedRequest(
            HttpMethod method,
            string uri,
            string accessToken,
            object? body = null)
        {
            var request = new HttpRequestMessage(method, uri);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            if (body is not null)
            {
                request.Content = JsonContent.Create(body);
            }

            return request;
        }
    }
}
