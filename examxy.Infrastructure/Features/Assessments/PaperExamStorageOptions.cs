namespace examxy.Infrastructure.Features.Assessments
{
    public sealed class PaperExamStorageOptions
    {
        public const string SectionName = "PaperExamStorage";

        public string Provider { get; set; } = "Local";
        public string RootPath { get; set; } = "App_Data/paper-exam";
    }
}
