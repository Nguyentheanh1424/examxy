using examxy.Infrastructure.Identity.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace test.Integration.Auth
{
    public sealed class InfrastructureConfigurationTests
    {
        [Fact]
        public void AddInfrastructure_WithoutEmailSection_ThrowsInvalidOperationException()
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = "Data Source=test.db",
                    ["DatabaseProvider"] = "Sqlite",
                    ["Jwt:Issuer"] = "issuer",
                    ["Jwt:Audience"] = "audience",
                    ["Jwt:SecretKey"] = "ExamxyTestSecretKeyAtLeast32Chars!",
                    ["AppUrls:FrontendBaseUrl"] = "https://client.examxy.test",
                    ["AppUrls:ConfirmEmailPath"] = "/confirm-email",
                    ["AppUrls:ResetPasswordPath"] = "/reset-password",
                    ["AppUrls:StudentDashboardPath"] = "/student/dashboard",
                    ["InternalAdminProvisioning:HeaderName"] = "X-Examxy-Internal-Admin-Secret",
                    ["InternalAdminProvisioning:SharedSecret"] = "test-secret"
                })
                .Build();

            var services = new ServiceCollection();

            var exception = Assert.Throws<InvalidOperationException>(
                () => services.AddInfrastructure(configuration));

            Assert.Equal("Email configuration section is missing.", exception.Message);
        }

        [Fact]
        public void AddInfrastructure_WithInvalidFrontendBaseUrl_ThrowsInvalidOperationException()
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = "Data Source=test.db",
                    ["DatabaseProvider"] = "Sqlite",
                    ["Jwt:Issuer"] = "issuer",
                    ["Jwt:Audience"] = "audience",
                    ["Jwt:SecretKey"] = "ExamxyTestSecretKeyAtLeast32Chars!",
                    ["Email:FromEmail"] = "noreply@examxy.test",
                    ["Email:FromName"] = "examxy-tests",
                    ["Email:Host"] = "smtp.examxy.test",
                    ["Email:Port"] = "587",
                    ["Email:Username"] = "test-user",
                    ["Email:Password"] = "test-password",
                    ["AppUrls:FrontendBaseUrl"] = "not-a-valid-url",
                    ["AppUrls:ConfirmEmailPath"] = "/confirm-email",
                    ["AppUrls:ResetPasswordPath"] = "/reset-password",
                    ["AppUrls:StudentDashboardPath"] = "/student/dashboard",
                    ["InternalAdminProvisioning:HeaderName"] = "X-Examxy-Internal-Admin-Secret",
                    ["InternalAdminProvisioning:SharedSecret"] = "test-secret"
                })
                .Build();

            var services = new ServiceCollection();

            var exception = Assert.Throws<InvalidOperationException>(
                () => services.AddInfrastructure(configuration));

            Assert.Equal("AppUrls FrontendBaseUrl must be an absolute URL.", exception.Message);
        }
    }
}
