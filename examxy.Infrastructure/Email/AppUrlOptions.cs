namespace examxy.Infrastructure.Email
{
    public sealed class AppUrlOptions
    {
        public const string SectionName = "AppUrls";

        public string FrontendBaseUrl { get; set; } = string.Empty;

        public string ConfirmEmailPath { get; set; } = string.Empty;

        public string ResetPasswordPath { get; set; } = string.Empty;

        public string StudentDashboardPath { get; set; } = string.Empty;
    }
}
