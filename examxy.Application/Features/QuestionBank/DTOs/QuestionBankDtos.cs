namespace examxy.Application.Features.QuestionBank.DTOs
{
    public static class QuestionBankSchemaVersions
    {
        public const int CurrentContentSchemaVersion = 2;
        public const int CurrentAnswerKeySchemaVersion = 2;
        public const string CurrentRendererVersion = "latex-v1";
    }

    public class QuestionDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int CurrentVersionNumber { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public IReadOnlyCollection<QuestionVersionDto> Versions { get; set; } = Array.Empty<QuestionVersionDto>();
        public IReadOnlyCollection<string> Tags { get; set; } = Array.Empty<string>();
    }

    public class QuestionVersionDto
    {
        public Guid Id { get; set; }
        public int VersionNumber { get; set; }
        public string QuestionType { get; set; } = string.Empty;
        public string StemRichText { get; set; } = string.Empty;
        public string StemPlainText { get; set; } = string.Empty;
        public string ExplanationRichText { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int EstimatedSeconds { get; set; }
        public int ContentSchemaVersion { get; set; }
        public int AnswerKeySchemaVersion { get; set; }
        public string RendererVersion { get; set; } = string.Empty;
        public string SearchText { get; set; } = string.Empty;
        public string ContentJson { get; set; } = "{}";
        public string AnswerKeyJson { get; set; } = "{}";
        public string ExplanationJson { get; set; } = "{}";
        public string CreatedByUserId { get; set; } = string.Empty;
        public IReadOnlyCollection<QuestionAttachmentDto> Attachments { get; set; } = Array.Empty<QuestionAttachmentDto>();
    }

    public class QuestionAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
        public string StorageProvider { get; set; } = string.Empty;
        public string StorageKey { get; set; } = string.Empty;
        public string PublicUrl { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
    }

    public class CreateQuestionRequestDto
    {
        public string AuthoringMode { get; set; } = string.Empty;
        public string StemText { get; set; } = string.Empty;
        public RichContentDocumentDto? Stem { get; set; }
        public IReadOnlyCollection<QuestionChoiceRequestDto> Choices { get; set; } = Array.Empty<QuestionChoiceRequestDto>();
        public RichContentDocumentDto? Explanation { get; set; }
        public QuestionAnswerKeyRequestDto? AnswerKey { get; set; }
        public IReadOnlyCollection<MatchingItemRequestDto> LeftItems { get; set; } = Array.Empty<MatchingItemRequestDto>();
        public IReadOnlyCollection<MatchingItemRequestDto> RightItems { get; set; } = Array.Empty<MatchingItemRequestDto>();
        public IReadOnlyCollection<OrderingItemRequestDto> Items { get; set; } = Array.Empty<OrderingItemRequestDto>();
        public IReadOnlyCollection<QuestionMediaRequestDto> Media { get; set; } = Array.Empty<QuestionMediaRequestDto>();
        public string StemRichText { get; set; } = string.Empty;
        public string StemPlainText { get; set; } = string.Empty;
        public string QuestionType { get; set; } = "SingleChoice";
        public string ExplanationRichText { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int EstimatedSeconds { get; set; }
        public string ContentJson { get; set; } = "{}";
        public string AnswerKeyJson { get; set; } = "{}";
        public IReadOnlyCollection<string> Tags { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<CreateQuestionAttachmentRequestDto> Attachments { get; set; } = Array.Empty<CreateQuestionAttachmentRequestDto>();
    }

    public class CreateQuestionAttachmentRequestDto
    {
        public Guid? AttachmentId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
        public string StorageProvider { get; set; } = "ExternalUrl";
        public string StorageKey { get; set; } = string.Empty;
    }

    public class UpdateQuestionRequestDto : CreateQuestionRequestDto
    {
        public string Status { get; set; } = "Active";
    }

    public class QuestionChoiceRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public RichContentDocumentDto? Content { get; set; }
    }

    public class QuestionAnswerKeyRequestDto
    {
        public IReadOnlyCollection<string> CorrectChoiceIds { get; set; } = Array.Empty<string>();
        public bool? Value { get; set; }
        public IReadOnlyCollection<MatchingAnswerRequestDto> Matches { get; set; } = Array.Empty<MatchingAnswerRequestDto>();
        public IReadOnlyCollection<string> OrderedItemIds { get; set; } = Array.Empty<string>();
        public string GradingMode { get; set; } = "Manual";
    }

    public class MatchingItemRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public RichContentDocumentDto? Content { get; set; }
    }

    public class MatchingAnswerRequestDto
    {
        public string LeftId { get; set; } = string.Empty;
        public string RightId { get; set; } = string.Empty;
    }

    public class OrderingItemRequestDto
    {
        public string Id { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public RichContentDocumentDto? Content { get; set; }
    }

    public class QuestionMediaRequestDto
    {
        public string Type { get; set; } = string.Empty;
        public Guid AttachmentId { get; set; }
    }

    public class RichContentDocumentDto
    {
        public int SchemaVersion { get; set; } = QuestionBankSchemaVersions.CurrentContentSchemaVersion;
        public IReadOnlyCollection<RichContentBlockDto> Blocks { get; set; } = Array.Empty<RichContentBlockDto>();
    }

    public class RichContentBlockDto
    {
        public string Type { get; set; } = string.Empty;
        public IReadOnlyCollection<InlineNodeDto> Inline { get; set; } = Array.Empty<InlineNodeDto>();
        public string Latex { get; set; } = string.Empty;
        public Guid? AttachmentId { get; set; }
        public string AltText { get; set; } = string.Empty;
        public string Caption { get; set; } = string.Empty;
        public string GraphType { get; set; } = string.Empty;
        public IReadOnlyCollection<GraphExpressionDto> Expressions { get; set; } = Array.Empty<GraphExpressionDto>();
        public GraphViewportDto? Viewport { get; set; }
        public IReadOnlyCollection<IReadOnlyCollection<TableCellDto>> Rows { get; set; } = Array.Empty<IReadOnlyCollection<TableCellDto>>();
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
    }

    public class InlineNodeDto
    {
        public string Type { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string Latex { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    public class GraphExpressionDto
    {
        public string Latex { get; set; } = string.Empty;
    }

    public class GraphViewportDto
    {
        public decimal XMin { get; set; }
        public decimal XMax { get; set; }
        public decimal YMin { get; set; }
        public decimal YMax { get; set; }
    }

    public class TableCellDto
    {
        public RichContentDocumentDto Content { get; set; } = new();
        public int? ColSpan { get; set; }
        public int? RowSpan { get; set; }
    }

    public class QuestionBankCapabilitiesDto
    {
        public int ContentSchemaVersion { get; set; } = QuestionBankSchemaVersions.CurrentContentSchemaVersion;
        public IReadOnlyCollection<string> SupportedQuestionTypes { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<string> SupportedContentBlocks { get; set; } = Array.Empty<string>();
        public LatexCapabilitiesDto Latex { get; set; } = new();
        public AttachmentCapabilitiesDto Attachments { get; set; } = new();
    }

    public class LatexCapabilitiesDto
    {
        public bool Enabled { get; set; }
        public bool AllowInlineMath { get; set; }
        public bool AllowDisplayMath { get; set; }
    }

    public class AttachmentCapabilitiesDto
    {
        public long MaxImageSizeBytes { get; set; }
        public IReadOnlyCollection<string> AllowedImageContentTypes { get; set; } = Array.Empty<string>();
    }

    public class CreateQuestionBankAttachmentUploadUrlRequestDto
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
    }

    public class CreateQuestionBankAttachmentUploadUrlResponseDto
    {
        public Guid AttachmentId { get; set; }
        public string UploadUrl { get; set; } = string.Empty;
        public string Method { get; set; } = "POST";
        public IReadOnlyDictionary<string, string> Headers { get; set; } =
            new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        public QuestionAttachmentDto Attachment { get; set; } = new();
    }

    public class CompleteQuestionBankAttachmentUploadRequestDto
    {
        public Guid AttachmentId { get; set; }
        public string Base64Content { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
    }

    public class QuestionBankAttachmentFileDto
    {
        public required Stream Content { get; init; }
        public string FileName { get; init; } = string.Empty;
        public string ContentType { get; init; } = string.Empty;
    }

    public class QuestionBankQueryDto
    {
        public string Query { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string Tag { get; set; } = string.Empty;
        public bool? HasMath { get; set; }
        public bool? HasMedia { get; set; }
        public bool? HasGraph { get; set; }
        public int? SchemaVersion { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class QuestionBankPagedResultDto
    {
        public IReadOnlyCollection<QuestionDto> Items { get; set; } = Array.Empty<QuestionDto>();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public QuestionBankFacetsDto Facets { get; set; } = new();
    }

    public class QuestionBankFacetsDto
    {
        public IReadOnlyCollection<string> Types { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<string> Tags { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<string> Difficulties { get; set; } = Array.Empty<string>();
    }

    public class PreviewLatexRequestDto
    {
        public CreateQuestionRequestDto Question { get; set; } = new();
        public bool IncludeAnswers { get; set; }
        public bool IncludeExplanations { get; set; }
    }

    public class PreviewLatexResponseDto
    {
        public string Latex { get; set; } = string.Empty;
        public string LatexFragment { get; set; } = string.Empty;
        public IReadOnlyCollection<QuestionBankRenderDiagnosticDto> Warnings { get; set; } = Array.Empty<QuestionBankRenderDiagnosticDto>();
        public IReadOnlyCollection<QuestionBankRenderDiagnosticDto> Errors { get; set; } = Array.Empty<QuestionBankRenderDiagnosticDto>();
    }

    public class PreviewQuestionImportRequestDto
    {
        public string QuestionType { get; set; } = "SingleChoice";
        public string SourceFormat { get; set; } = "LatexText";
        public string RawText { get; set; } = string.Empty;
    }

    public class PreviewQuestionImportResponseDto
    {
        public string Status { get; set; } = "Failed";
        public string QuestionType { get; set; } = string.Empty;
        public CreateQuestionRequestDto Draft { get; set; } = new();
        public IReadOnlyCollection<QuestionBankImportDiagnosticDto> Warnings { get; set; } = Array.Empty<QuestionBankImportDiagnosticDto>();
        public IReadOnlyCollection<QuestionBankImportDiagnosticDto> Errors { get; set; } = Array.Empty<QuestionBankImportDiagnosticDto>();
    }

    public class QuestionBankImportDiagnosticDto
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
    }

    public class QuestionBankRenderDiagnosticDto
    {
        public Guid? QuestionVersionId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
    }

    public class CreateQuestionBankExportRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public IReadOnlyCollection<Guid> QuestionVersionIds { get; set; } = Array.Empty<Guid>();
        public QuestionBankExportOptionsDto Options { get; set; } = new();
    }

    public class QuestionBankExportOptionsDto
    {
        public bool IncludeAnswers { get; set; }
        public bool IncludeExplanations { get; set; }
        public bool ShuffleQuestions { get; set; }
        public bool ShuffleChoices { get; set; }
        public string PaperSize { get; set; } = "A4";
        public string TemplateId { get; set; } = "default-vietnamese-exam";
        public string ChoiceLayout { get; set; } = "Vertical";
    }

    public class QuestionBankExportJobDto
    {
        public Guid ExportJobId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int QuestionCount { get; set; }
        public Guid? LatexFileId { get; set; }
        public Guid? PdfFileId { get; set; }
        public Guid? CompileLogFileId { get; set; }
        public string DownloadUrl { get; set; } = string.Empty;
        public IReadOnlyCollection<QuestionBankExportErrorDto> Errors { get; set; } = Array.Empty<QuestionBankExportErrorDto>();
        public IReadOnlyCollection<string> Warnings { get; set; } = Array.Empty<string>();
    }

    public class QuestionBankExportErrorDto
    {
        public Guid? QuestionVersionId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
