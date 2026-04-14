namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Result of an internal maintenance operation such as role repair or profile backfill.
    /// </summary>
    public sealed class IdentityMaintenanceResultDto
    {
        /// <summary>
        /// Stable operation name that identifies which maintenance task was executed.
        /// </summary>
        public string Operation { get; set; } = string.Empty;

        /// <summary>
        /// Number of records inspected during the maintenance run.
        /// </summary>
        public int ScannedCount { get; set; }

        /// <summary>
        /// Number of records changed by the maintenance run.
        /// </summary>
        public int ChangedCount { get; set; }

        /// <summary>
        /// Non-fatal warnings collected while the maintenance operation ran.
        /// </summary>
        public IReadOnlyCollection<string> Warnings { get; set; } = Array.Empty<string>();
    }
}
