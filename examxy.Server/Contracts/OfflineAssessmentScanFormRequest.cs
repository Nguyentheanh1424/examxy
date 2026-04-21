using Microsoft.AspNetCore.Http;

namespace examxy.Server.Contracts
{
    public sealed class OfflineAssessmentScanFormRequest
    {
        public IFormFile RawImage { get; set; } = null!;
        public Guid BindingId { get; set; }
        public int BindingVersionUsed { get; set; }
        public string ConfigHashUsed { get; set; } = string.Empty;
        public string ClientSchemaVersion { get; set; } = string.Empty;
        public string? ClientAppVersion { get; set; }
        public string AnswersJson { get; set; } = "[]";
        public string MetadataJson { get; set; } = "{}";
        public string ConfidenceSummaryJson { get; set; } = "{}";
        public string WarningFlagsJson { get; set; } = "[]";
        public string ConflictFlagsJson { get; set; } = "[]";
        public string RawScanPayloadJson { get; set; } = "{}";
    }
}
