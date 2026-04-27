using examxy.Application.Abstractions.Email;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace test.Integration.Auth
{
    public sealed class AuthApiFactory : Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program>
    {
        private readonly string _databasePath =
            Path.Combine(Path.GetTempPath(), $"examxy-auth-tests-{Guid.NewGuid():N}.db");

        private readonly Dictionary<string, string?> _environmentOverrides = new()
        {
            ["ConnectionStrings__DefaultConnection"] = null,
            ["DatabaseProvider"] = "Sqlite",
            ["Jwt__Issuer"] = "examxy-test",
            ["Jwt__Audience"] = "examxy-test-client",
            ["Jwt__SecretKey"] = "ExamxyTestSecretKeyAtLeast32Chars!",
            ["Jwt__AccessTokenExpirationMinutes"] = "60",
            ["Jwt__RefreshTokenExpirationDays"] = "7",
            ["Email__FromEmail"] = "noreply@examxy.test",
            ["Email__FromName"] = "examxy-tests",
            ["Email__Host"] = "smtp.examxy.test",
            ["Email__Port"] = "587",
            ["Email__Username"] = "test-user",
            ["Email__Password"] = "test-password",
            ["AppUrls__FrontendBaseUrl"] = "https://client.examxy.test",
            ["AppUrls__ConfirmEmailPath"] = "/confirm-email",
            ["AppUrls__ResetPasswordPath"] = "/reset-password",
            ["AppUrls__StudentDashboardPath"] = "/student/dashboard",
            ["InternalAdminProvisioning__HeaderName"] = "X-Examxy-Internal-Admin-Secret",
            ["InternalAdminProvisioning__SharedSecret"] = "integration-admin-secret",
            ["InternalTestDataProvisioning__HeaderName"] = "X-Examxy-Internal-Test-Data-Secret",
            ["InternalTestDataProvisioning__SharedSecret"] = "integration-test-data-secret",
            ["NotificationReminders__Enabled"] = "false",
            ["NotificationReminders__LeadTimeHours"] = "24",
            ["NotificationReminders__PollIntervalSeconds"] = "60",
            ["NotificationReminders__LookbackMinutes"] = "10",
            ["NotificationReminders__BatchSize"] = "200"
        };

        public InMemoryEmailSender EmailSender { get; } = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            _environmentOverrides["ConnectionStrings__DefaultConnection"] = $"Data Source={_databasePath}";

            foreach (var entry in _environmentOverrides)
            {
                Environment.SetEnvironmentVariable(entry.Key, entry.Value);
            }

            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IEmailSender>();
                services.AddSingleton<IEmailSender>(EmailSender);

                using var serviceProvider = services.BuildServiceProvider();
                using var scope = serviceProvider.CreateScope();

                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                dbContext.Database.EnsureDeleted();
                dbContext.Database.EnsureCreated();
            });
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);

            if (!disposing)
            {
                return;
            }

            try
            {
                if (File.Exists(_databasePath))
                {
                    File.Delete(_databasePath);
                }
            }
            catch (IOException)
            {
            }
            catch (UnauthorizedAccessException)
            {
            }

            foreach (var entry in _environmentOverrides)
            {
                Environment.SetEnvironmentVariable(entry.Key, null);
            }
        }
    }
}
