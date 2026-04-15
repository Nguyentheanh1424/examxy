namespace examxy.Infrastructure.Identity
{
    public sealed class InternalTestDataProvisioningOptions
    {
        public const string SectionName = "InternalTestDataProvisioning";

        public string HeaderName { get; set; } = "X-Examxy-Internal-Test-Data-Secret";

        public string SharedSecret { get; set; } = string.Empty;
    }
}
