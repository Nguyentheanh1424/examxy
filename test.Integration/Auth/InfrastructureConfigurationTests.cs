using examxy.Infrastructure.Features.Assessments;
using examxy.Infrastructure.Features.Notifications;
using examxy.Infrastructure.Identity.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

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

        [Fact]
        public void AddInfrastructure_WithReminderLeadTimesList_BindsMultipleLeadTimes()
        {
            var configuration = BuildValidConfiguration(new Dictionary<string, string?>
            {
                ["NotificationReminders:LeadTimesHours:0"] = "48",
                ["NotificationReminders:LeadTimesHours:1"] = "24",
                ["NotificationReminders:LeadTimesHours:2"] = "6"
            });

            var services = new ServiceCollection();
            services.AddLogging();
            services.AddInfrastructure(configuration);

            using var provider = services.BuildServiceProvider();
            var options = provider.GetRequiredService<IOptions<NotificationReminderOptions>>().Value;

            Assert.Equal(new[] { 48, 24, 6 }, options.GetLeadTimesHours());
        }

        [Fact]
        public void AddInfrastructure_WithInvalidReminderLeadTimesList_ThrowsInvalidOperationException()
        {
            var configuration = BuildValidConfiguration(new Dictionary<string, string?>
            {
                ["NotificationReminders:LeadTimesHours:0"] = "24",
                ["NotificationReminders:LeadTimesHours:1"] = "0"
            });

            var services = new ServiceCollection();
            services.AddLogging();

            var exception = Assert.Throws<InvalidOperationException>(
                () => services.AddInfrastructure(configuration));

            Assert.Equal("Notification reminder configuration is invalid.", exception.Message);
        }

        [Fact]
        public void AddInfrastructure_WithPaperExamStorageConfig_BindsLocalOptions()
        {
            var configuration = BuildValidConfiguration(new Dictionary<string, string?>
            {
                ["PaperExamStorage:Provider"] = "Local",
                ["PaperExamStorage:RootPath"] = "App_Data/custom-paper-exam"
            });

            var services = new ServiceCollection();
            services.AddLogging();
            services.AddInfrastructure(configuration);

            using var provider = services.BuildServiceProvider();
            var options = provider.GetRequiredService<IOptions<PaperExamStorageOptions>>().Value;

            Assert.Equal("Local", options.Provider);
            Assert.Equal("App_Data/custom-paper-exam", options.RootPath);
        }

        [Fact]
        public void AddInfrastructure_WithUnsupportedPaperExamStorageProvider_ThrowsInvalidOperationException()
        {
            var configuration = BuildValidConfiguration(new Dictionary<string, string?>
            {
                ["PaperExamStorage:Provider"] = "S3"
            });

            var services = new ServiceCollection();
            services.AddLogging();

            var exception = Assert.Throws<InvalidOperationException>(
                () => services.AddInfrastructure(configuration));

            Assert.Equal("Paper exam storage provider is not supported.", exception.Message);
        }

        [Fact]
        public void AddInfrastructure_WithMissingPaperExamStorageRootPath_ThrowsInvalidOperationException()
        {
            var configuration = BuildValidConfiguration(new Dictionary<string, string?>
            {
                ["PaperExamStorage:RootPath"] = string.Empty
            });

            var services = new ServiceCollection();
            services.AddLogging();

            var exception = Assert.Throws<InvalidOperationException>(
                () => services.AddInfrastructure(configuration));

            Assert.Equal("Paper exam storage root path is required.", exception.Message);
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
                ["NotificationReminders:BatchSize"] = "200",
                ["PaperExamStorage:Provider"] = "Local",
                ["PaperExamStorage:RootPath"] = "App_Data/paper-exam"
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
