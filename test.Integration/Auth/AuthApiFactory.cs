using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System.IO;

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
            ["IdentitySeed__AdminEmail"] = "admin@examxy.test",
            ["IdentitySeed__AdminUserName"] = "admin",
            ["IdentitySeed__AdminPassword"] = "Admin123"
        };

        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            _environmentOverrides["ConnectionStrings__DefaultConnection"] = $"Data Source={_databasePath}";

            foreach (var entry in _environmentOverrides)
            {
                Environment.SetEnvironmentVariable(entry.Key, entry.Value);
            }

            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
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
