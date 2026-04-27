using System.Text.Json;

namespace examxy.Application.Features.PaperExams.DTOs
{
    public class PaperExamTemplateDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PaperSize { get; set; } = string.Empty;
        public int? OutputWidth { get; set; }
        public int? OutputHeight { get; set; }
        public string MarkerScheme { get; set; } = string.Empty;
        public bool HasStudentIdField { get; set; }
        public bool HasQuizIdField { get; set; }
        public bool HasHandwrittenRegions { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public IReadOnlyCollection<PaperExamTemplateVersionDto> Versions { get; set; } = Array.Empty<PaperExamTemplateVersionDto>();
    }

    public class PaperExamTemplateVersionDto
    {
        public Guid Id { get; set; }
        public Guid TemplateId { get; set; }
        public int VersionNumber { get; set; }
        public string SchemaVersion { get; set; } = string.Empty;
        public string GeometryConfigHash { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int QuestionCount { get; set; }
        public int OptionsPerQuestion { get; set; }
        public decimal AbsThreshold { get; set; }
        public decimal RelThreshold { get; set; }
        public string ScoringMethod { get; set; } = string.Empty;
        public string ScoringParamsJson { get; set; } = "{}";
        public string PayloadSchemaVersion { get; set; } = string.Empty;
        public string? MinClientAppVersion { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? PublishedAtUtc { get; set; }
        public IReadOnlyCollection<PaperExamTemplateAssetDto> Assets { get; set; } = Array.Empty<PaperExamTemplateAssetDto>();
        public IReadOnlyCollection<PaperExamMetadataFieldDto> MetadataFields { get; set; } = Array.Empty<PaperExamMetadataFieldDto>();
    }

    public class PaperExamTemplateAssetDto
    {
        public Guid Id { get; set; }
        public string AssetType { get; set; } = string.Empty;
        public string StoragePath { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        public string JsonContent { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
    }

    public class PaperExamMetadataFieldDto
    {
        public Guid Id { get; set; }
        public string FieldCode { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public string DecodeMode { get; set; } = string.Empty;
        public string GeometryJson { get; set; } = "{}";
        public string ValidationPolicyJson { get; set; } = "{}";
    }

    public class AssessmentPaperBindingDto
    {
        public Guid Id { get; set; }
        public Guid AssessmentId { get; set; }
        public Guid TemplateVersionId { get; set; }
        public string TemplateCode { get; set; } = string.Empty;
        public int TemplateVersionNumber { get; set; }
        public int BindingVersion { get; set; }
        public string ConfigHash { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string AnswerMapJson { get; set; } = "[]";
        public string MetadataPolicyJson { get; set; } = "{}";
        public string SubmissionPolicyJson { get; set; } = "{}";
        public string ReviewPolicyJson { get; set; } = "{}";
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
    }

    public class StudentOfflineScanConfigDto
    {
        public Guid AssessmentId { get; set; }
        public Guid ClassId { get; set; }
        public Guid BindingId { get; set; }
        public int BindingVersion { get; set; }
        public string TemplateCode { get; set; } = string.Empty;
        public int TemplateVersion { get; set; }
        public string SchemaVersion { get; set; } = string.Empty;
        public string ConfigHash { get; set; } = string.Empty;
        public string PaperSize { get; set; } = string.Empty;
        public int? OutputWidth { get; set; }
        public int? OutputHeight { get; set; }
        public string MarkerScheme { get; set; } = string.Empty;
        public int QuestionCount { get; set; }
        public int OptionsPerQuestion { get; set; }
        public decimal AbsThreshold { get; set; }
        public decimal RelThreshold { get; set; }
        public string ScoringMethod { get; set; } = string.Empty;
        public JsonElement MarkerLayout { get; set; }
        public JsonElement CircleRois { get; set; }
        public JsonElement IdBubbleFields { get; set; }
        public JsonElement RegionWindows { get; set; }
        public IReadOnlyCollection<string> RequiredMetadataFields { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<string> OptionalMetadataFields { get; set; } = Array.Empty<string>();
        public JsonElement MetadataPolicy { get; set; }
        public JsonElement ReviewPolicy { get; set; }
        public JsonElement SubmissionPolicy { get; set; }
        public string? MinClientAppVersion { get; set; }
        public DateTime? CloseAtUtc { get; set; }
    }

    public class CreatePaperExamTemplateRequestDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string PaperSize { get; set; } = "A4";
        public int? OutputWidth { get; set; }
        public int? OutputHeight { get; set; }
        public string MarkerScheme { get; set; } = "custom";
        public bool HasStudentIdField { get; set; }
        public bool HasQuizIdField { get; set; }
        public bool HasHandwrittenRegions { get; set; }
    }

    public class CreatePaperExamTemplateVersionRequestDto
    {
        public string SchemaVersion { get; set; } = "1.0";
        public int QuestionCount { get; set; }
        public int OptionsPerQuestion { get; set; }
        public decimal AbsThreshold { get; set; }
        public decimal RelThreshold { get; set; }
        public string ScoringMethod { get; set; } = "annulus_patch_darkness";
        public string ScoringParamsJson { get; set; } = "{}";
        public string PayloadSchemaVersion { get; set; } = "1.0";
        public string? MinClientAppVersion { get; set; }
    }

    public class UpdatePaperExamTemplateVersionRequestDto : CreatePaperExamTemplateVersionRequestDto
    {
    }

    public class UploadPaperExamTemplateAssetRequestDto
    {
        public string AssetType { get; set; } = string.Empty;
        public string JsonContent { get; set; } = string.Empty;
        public bool IsRequired { get; set; } = true;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "application/json";
        public string? Base64Content { get; set; }
    }

    public class UpsertPaperExamMetadataFieldRequestDto
    {
        public string FieldCode { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public string DecodeMode { get; set; } = "bubble_grid";
        public string GeometryJson { get; set; } = "{}";
        public string ValidationPolicyJson { get; set; } = "{}";
    }

    public class ValidatePaperExamTemplateVersionResultDto
    {
        public Guid TemplateVersionId { get; set; }
        public bool IsValid { get; set; }
        public string GeometryConfigHash { get; set; } = string.Empty;
        public IReadOnlyCollection<string> Errors { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<string> Warnings { get; set; } = Array.Empty<string>();
    }

    public class AssessmentPaperBindingMapItemDto
    {
        public int QuestionNumber { get; set; }
        public Guid AssessmentItemId { get; set; }
    }

    public class UpsertAssessmentPaperBindingRequestDto
    {
        public Guid TemplateVersionId { get; set; }
        public IReadOnlyCollection<AssessmentPaperBindingMapItemDto> AnswerMap { get; set; } = Array.Empty<AssessmentPaperBindingMapItemDto>();
        public string MetadataPolicyJson { get; set; } = "{}";
        public string SubmissionPolicyJson { get; set; } = "{}";
        public string ReviewPolicyJson { get; set; } = "{}";
        public bool Activate { get; set; } = true;
    }

    public class OfflineRecognizedAnswerDto
    {
        public int QuestionNumber { get; set; }
        public string DetectedOption { get; set; } = string.Empty;
        public string DetectedAnswerJson { get; set; } = "{}";
        public string ConfidenceJson { get; set; } = "{}";
    }

    public class SubmitOfflineAssessmentScanRequestDto
    {
        public Guid BindingId { get; set; }
        public int BindingVersionUsed { get; set; }
        public string ConfigHashUsed { get; set; } = string.Empty;
        public string ClientSchemaVersion { get; set; } = string.Empty;
        public string? ClientAppVersion { get; set; }
        public IReadOnlyCollection<OfflineRecognizedAnswerDto> Answers { get; set; } = Array.Empty<OfflineRecognizedAnswerDto>();
        public string MetadataJson { get; set; } = "{}";
        public string ConfidenceSummaryJson { get; set; } = "{}";
        public string WarningFlagsJson { get; set; } = "[]";
        public string ConflictFlagsJson { get; set; } = "[]";
        public string RawScanPayloadJson { get; set; } = "{}";
        public string RawImageStoragePath { get; set; } = string.Empty;
    }

    public class AssessmentScanAnswerDto
    {
        public Guid Id { get; set; }
        public Guid AssessmentItemId { get; set; }
        public int QuestionNumber { get; set; }
        public string DetectedOption { get; set; } = string.Empty;
        public string DetectedAnswerJson { get; set; } = "{}";
        public bool? IsCorrect { get; set; }
        public decimal EarnedPoints { get; set; }
        public string ConfidenceJson { get; set; } = "{}";
    }

    public class AssessmentScanArtifactDto
    {
        public Guid Id { get; set; }
        public string ArtifactType { get; set; } = string.Empty;
        public string StoragePath { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
    }

    public class AssessmentScanSubmissionDto
    {
        public Guid Id { get; set; }
        public Guid AssessmentId { get; set; }
        public string StudentUserId { get; set; } = string.Empty;
        public Guid BindingId { get; set; }
        public int BindingVersionUsed { get; set; }
        public string ConfigHashUsed { get; set; } = string.Empty;
        public string ClientSchemaVersion { get; set; } = string.Empty;
        public string? ClientAppVersion { get; set; }
        public string RawImagePath { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? FinalizedAtUtc { get; set; }
        public string? TeacherNote { get; set; }
        public string? ReviewedByTeacherUserId { get; set; }
        public DateTime? ReviewedAtUtc { get; set; }
        public AssessmentScanResultDto? Result { get; set; }
        public IReadOnlyCollection<AssessmentScanAnswerDto> Answers { get; set; } = Array.Empty<AssessmentScanAnswerDto>();
        public IReadOnlyCollection<AssessmentScanArtifactDto> Artifacts { get; set; } = Array.Empty<AssessmentScanArtifactDto>();
    }

    public class AssessmentScanResultDto
    {
        public Guid Id { get; set; }
        public decimal Score { get; set; }
        public int GradedQuestionCount { get; set; }
        public int TotalQuestionCount { get; set; }
        public string? DetectedStudentId { get; set; }
        public string? DetectedQuizId { get; set; }
        public string ConfidenceSummaryJson { get; set; } = "{}";
        public string WarningFlagsJson { get; set; } = "[]";
        public string ConflictFlagsJson { get; set; } = "[]";
    }

    public class ReviewOfflineAssessmentScanRequestDto
    {
        public string? TeacherNote { get; set; }
        public bool ForceFinalize { get; set; }
        public IReadOnlyCollection<OfflineRecognizedAnswerDto> OverrideAnswers { get; set; } = Array.Empty<OfflineRecognizedAnswerDto>();
    }
}
