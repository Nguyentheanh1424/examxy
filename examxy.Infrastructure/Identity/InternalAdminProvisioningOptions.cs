namespace examxy.Infrastructure.Identity
{
    public sealed class InternalAdminProvisioningOptions
    {
        public const string SectionName = "InternalAdminProvisioning";

        public string HeaderName { get; set; } = "X-Examxy-Internal-Admin-Secret";

        public string SharedSecret { get; set; } = string.Empty;
    }
}
