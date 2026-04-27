using examxy.Application.Abstractions.Email;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Features.Assessments;
using examxy.Application.Features.ClassContent;
using examxy.Application.Features.Classrooms;
using examxy.Application.Features.Notifications;
using examxy.Application.Features.PaperExams;
using examxy.Application.Features.QuestionBank;
using examxy.Application.Features.Realtime;
using examxy.Application.Features.TestData;
using examxy.Infrastructure.Email;
using examxy.Infrastructure.Features.Assessments;
using examxy.Infrastructure.Features.ClassContent;
using examxy.Infrastructure.Features.Classrooms;
using examxy.Infrastructure.Features.Notifications;
using examxy.Infrastructure.Features.QuestionBank;
using examxy.Infrastructure.Features.Realtime;
using examxy.Infrastructure.Features.TestData;
using examxy.Infrastructure.Identity.Services;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace examxy.Infrastructure.Identity.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            var databaseProvider = configuration["DatabaseProvider"];

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
            }

            services.Configure<JwtOptions>(
                configuration.GetSection(JwtOptions.SectionName));
            services.Configure<EmailOptions>(
                configuration.GetSection(EmailOptions.SectionName));
            services.Configure<AppUrlOptions>(
                configuration.GetSection(AppUrlOptions.SectionName));
            services.Configure<InternalAdminProvisioningOptions>(
                configuration.GetSection(InternalAdminProvisioningOptions.SectionName));
            services.Configure<InternalTestDataProvisioningOptions>(
                configuration.GetSection(InternalTestDataProvisioningOptions.SectionName));
            services.Configure<NotificationReminderOptions>(
                configuration.GetSection(NotificationReminderOptions.SectionName));
            services.Configure<PaperExamStorageOptions>(
                configuration.GetSection(PaperExamStorageOptions.SectionName));

            var jwtOptions = configuration
                .GetSection(JwtOptions.SectionName)
                .Get<JwtOptions>();
            var emailOptions = configuration
                .GetSection(EmailOptions.SectionName)
                .Get<EmailOptions>();
            var appUrlOptions = configuration
                .GetSection(AppUrlOptions.SectionName)
                .Get<AppUrlOptions>();
            var internalAdminOptions = configuration
                .GetSection(InternalAdminProvisioningOptions.SectionName)
                .Get<InternalAdminProvisioningOptions>();
            var internalTestDataOptions = configuration
                .GetSection(InternalTestDataProvisioningOptions.SectionName)
                .Get<InternalTestDataProvisioningOptions>();
            var notificationReminderOptions = configuration
                .GetSection(NotificationReminderOptions.SectionName)
                .Get<NotificationReminderOptions>() ?? new NotificationReminderOptions();
            var paperExamStorageOptions = configuration
                .GetSection(PaperExamStorageOptions.SectionName)
                .Get<PaperExamStorageOptions>() ?? new PaperExamStorageOptions();

            if (jwtOptions is null)
            {
                throw new InvalidOperationException("JWT configuration section is missing.");
            }

            if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey))
            {
                throw new InvalidOperationException("JWT SecretKey is missing.");
            }

            ValidateEmailOptions(emailOptions);
            ValidateAppUrlOptions(appUrlOptions);
            ValidateInternalAdminProvisioningOptions(internalAdminOptions);
            ValidateInternalTestDataProvisioningOptions(internalTestDataOptions);
            ValidateNotificationReminderOptions(notificationReminderOptions);
            ValidatePaperExamStorageOptions(paperExamStorageOptions);

            services.AddDbContext<AppDbContext>(options =>
            {
                if (string.Equals(databaseProvider, "Sqlite", StringComparison.OrdinalIgnoreCase))
                {
                    options.UseSqlite(connectionString);
                    return;
                }

                options.UseNpgsql(connectionString);
            });

            services
                .AddIdentity<ApplicationUser, IdentityRole>(options =>
                {
                    options.User.RequireUniqueEmail = true;

                    options.Password.RequireDigit = true;
                    options.Password.RequireLowercase = true;
                    options.Password.RequireUppercase = true;
                    options.Password.RequireNonAlphanumeric = false;
                    options.Password.RequiredLength = 6;
                    options.Password.RequiredUniqueChars = 1;

                    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                    options.Lockout.MaxFailedAccessAttempts = 5;
                    options.Lockout.AllowedForNewUsers = true;

                    options.SignIn.RequireConfirmedEmail = true;
                })
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.RequireHttpsMetadata = false;
                    options.SaveToken = true;
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;

                            if (!string.IsNullOrWhiteSpace(accessToken) &&
                                path.StartsWithSegments("/hubs/realtime"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidIssuer = jwtOptions.Issuer,
                        ValidateAudience = true,
                        ValidAudience = jwtOptions.Audience,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
                    };
                });

            services.AddAuthorization();
            services.AddHttpContextAccessor();
            services.AddSingleton<TimeProvider>(TimeProvider.System);

            services.AddScoped<RoleAssignmentService>();
            services.AddScoped<IdentityBootstrapService>();
            services.AddScoped<IIdentityAdministrationService, IdentityAdministrationService>();
            services.AddScoped<AuthResponseFactory>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<IAdminUserProvisioningService, AdminUserProvisioningService>();
            services.AddScoped<IStudentOnboardingService, StudentOnboardingService>();
            services.AddScoped<IStudentInvitationService, StudentInvitationService>();
            services.AddScoped<ITeacherClassService, TeacherClassService>();
            services.AddScoped<ITeacherRosterImportService, TeacherRosterImportService>();
            services.AddScoped<IRosterImportFileParser, RosterImportFileParser>();
            services.AddScoped<IClassContentService, ClassContentService>();
            services.AddScoped<INotificationInboxService, NotificationInboxService>();
            services.AddScoped<INotificationReminderProcessor, NotificationReminderProcessor>();
            services.AddScoped<IClassRealtimeAccessService, ClassRealtimeAccessService>();
            services.AddScoped<IQuestionBankService, QuestionBankService>();
            services.AddScoped<IClassAssessmentService, ClassAssessmentService>();
            services.AddScoped<IPaperExamStorage, LocalPaperExamStorage>();
            services.AddScoped<IPaperExamTemplateService, PaperExamTemplateService>();
            services.AddScoped<IStudentOfflineScanConfigService, StudentOfflineScanConfigService>();
            services.AddScoped<IOfflineAssessmentScanService, OfflineAssessmentScanService>();
            services.AddScoped<ITestDataSeedService, ClassDashboardTestDataSeedService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddTransient<IEmailSender, SmtpEmailSender>();

            if (notificationReminderOptions.Enabled)
            {
                services.AddHostedService<NotificationReminderWorker>();
            }

            return services;
        }

        private static void ValidateEmailOptions(EmailOptions? emailOptions)
        {
            if (emailOptions is null)
            {
                throw new InvalidOperationException("Email configuration section is missing.");
            }

            if (string.IsNullOrWhiteSpace(emailOptions.FromEmail) ||
                string.IsNullOrWhiteSpace(emailOptions.FromName) ||
                string.IsNullOrWhiteSpace(emailOptions.Host) ||
                emailOptions.Port <= 0 ||
                string.IsNullOrWhiteSpace(emailOptions.Username) ||
                string.IsNullOrWhiteSpace(emailOptions.Password))
            {
                throw new InvalidOperationException("Email configuration is incomplete.");
            }
        }

        private static void ValidateAppUrlOptions(AppUrlOptions? appUrlOptions)
        {
            if (appUrlOptions is null)
            {
                throw new InvalidOperationException("AppUrls configuration section is missing.");
            }

            if (string.IsNullOrWhiteSpace(appUrlOptions.FrontendBaseUrl) ||
                string.IsNullOrWhiteSpace(appUrlOptions.ConfirmEmailPath) ||
                string.IsNullOrWhiteSpace(appUrlOptions.ResetPasswordPath) ||
                string.IsNullOrWhiteSpace(appUrlOptions.StudentDashboardPath))
            {
                throw new InvalidOperationException("AppUrls configuration is incomplete.");
            }

            if (!Uri.TryCreate(appUrlOptions.FrontendBaseUrl, UriKind.Absolute, out _))
            {
                throw new InvalidOperationException("AppUrls FrontendBaseUrl must be an absolute URL.");
            }
        }

        private static void ValidateInternalAdminProvisioningOptions(
            InternalAdminProvisioningOptions? internalAdminOptions)
        {
            if (internalAdminOptions is null)
            {
                throw new InvalidOperationException("Internal admin provisioning configuration section is missing.");
            }

            if (string.IsNullOrWhiteSpace(internalAdminOptions.HeaderName) ||
                string.IsNullOrWhiteSpace(internalAdminOptions.SharedSecret))
            {
                throw new InvalidOperationException("Internal admin provisioning configuration is incomplete.");
            }
        }

        private static void ValidateInternalTestDataProvisioningOptions(
            InternalTestDataProvisioningOptions? internalTestDataOptions)
        {
            if (internalTestDataOptions is null)
            {
                throw new InvalidOperationException("Internal test-data provisioning configuration section is missing.");
            }

            if (string.IsNullOrWhiteSpace(internalTestDataOptions.HeaderName) ||
                string.IsNullOrWhiteSpace(internalTestDataOptions.SharedSecret))
            {
                throw new InvalidOperationException("Internal test-data provisioning configuration is incomplete.");
            }
        }

        private static void ValidateNotificationReminderOptions(
            NotificationReminderOptions options)
        {
            var leadTimes = options.GetLeadTimesHours();
            if (leadTimes.Count == 0 ||
                options.LeadTimesHours.Any(leadTime => leadTime <= 0) ||
                options.PollIntervalSeconds <= 0 ||
                options.LookbackMinutes <= 0 ||
                options.BatchSize <= 0)
            {
                throw new InvalidOperationException("Notification reminder configuration is invalid.");
            }
        }

        private static void ValidatePaperExamStorageOptions(
            PaperExamStorageOptions options)
        {
            if (!string.Equals(options.Provider, "Local", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Paper exam storage provider is not supported.");
            }

            if (string.IsNullOrWhiteSpace(options.RootPath))
            {
                throw new InvalidOperationException("Paper exam storage root path is required.");
            }
        }
    }
}
