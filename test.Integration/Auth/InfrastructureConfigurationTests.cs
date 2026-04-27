using examxy.Infrastructure.Identity.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

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
                    ["InternalAdminProvisioning:SharedSecret"] = "test-secret",
                    ["InternalTestDataProvisioning:HeaderName"] = "X-Examxy-Internal-Test-Data-Secret",
                    ["InternalTestDataProvisioning:SharedSecret"] = "test-test-data-secret"
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
                    ["InternalAdminProvisioning:SharedSecret"] = "test-secret",
                    ["InternalTestDataProvisioning:HeaderName"] = "X-Examxy-Internal-Test-Data-Secret",
                    ["InternalTestDataProvisioning:SharedSecret"] = "test-test-data-secret"
                })
                .Build();

            var services = new ServiceCollection();

            var exception = Assert.Throws<InvalidOperationException>(
                () => services.AddInfrastructure(configuration));

            Assert.Equal("AppUrls FrontendBaseUrl must be an absolute URL.", exception.Message);
        }

        [Fact]
        public void AddInfrastructure_WithReminderWorkerDisabled_DoesNotRegisterHostedService()
        {
            var configuration = BuildValidConfiguration(new Dictionary<string, string?>
            {
                ["NotificationReminders:Enabled"] = "false"
            });

            var services = new ServiceCollection();
            services.AddLogging();
            services.AddInfrastructure(configuration);

            using var provider = services.BuildServiceProvider();
            var hostedServices = provider.GetServices<IHostedService>();

            Assert.DoesNotContain(hostedServices, service => service.GetType().Name == "NotificationReminderWorker");
        }

        [Fact]
        public void AddInfrastructure_WithReminderWorkerEnabled_RegistersHostedService()
        {
            var configuration = BuildValidConfiguration(new Dictionary<string, string?>
            {
                ["NotificationReminders:Enabled"] = "true"
            });

            var services = new ServiceCollection();
            services.AddLogging();
            services.AddInfrastructure(configuration);

            using var provider = services.BuildServiceProvider();
            var hostedServices = provider.GetServices<IHostedService>();

            Assert.Contains(hostedServices, service => service.GetType().Name == "NotificationReminderWorker");
        }

        private static IConfiguration BuildValidConfiguration(
            IReadOnlyDictionary<string, string?> overrides)
        {
            var values = new Dictionary<string, string?>
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
                ["AppUrls:FrontendBaseUrl"] = "https://client.examxy.test",
                ["AppUrls:ConfirmEmailPath"] = "/confirm-email",
                ["AppUrls:ResetPasswordPath"] = "/reset-password",
                ["AppUrls:StudentDashboardPath"] = "/student/dashboard",
                ["InternalAdminProvisioning:HeaderName"] = "X-Examxy-Internal-Admin-Secret",
                ["InternalAdminProvisioning:SharedSecret"] = "test-secret",
                ["InternalTestDataProvisioning:HeaderName"] = "X-Examxy-Internal-Test-Data-Secret",
                ["InternalTestDataProvisioning:SharedSecret"] = "test-test-data-secret",
                ["NotificationReminders:Enabled"] = "true",
                ["NotificationReminders:LeadTimeHours"] = "24",
                ["NotificationReminders:PollIntervalSeconds"] = "60",
                ["NotificationReminders:LookbackMinutes"] = "10",
                ["NotificationReminders:BatchSize"] = "200"
            };

            foreach (var entry in overrides)
            {
                values[entry.Key] = entry.Value;
            }

            return new ConfigurationBuilder()
                .AddInMemoryCollection(values)
                .Build();
        }
    }
}
