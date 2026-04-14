namespace examxy.Application.Features.QuestionBank.DTOs
{
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
        public string ContentJson { get; set; } = "{}";
        public string AnswerKeyJson { get; set; } = "{}";
        public IReadOnlyCollection<QuestionAttachmentDto> Attachments { get; set; } = Array.Empty<QuestionAttachmentDto>();
    }

    public class QuestionAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
    }

    public class CreateQuestionRequestDto
    {
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
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
    }

    public class UpdateQuestionRequestDto
    {
        public string StemRichText { get; set; } = string.Empty;
        public string StemPlainText { get; set; } = string.Empty;
        public string QuestionType { get; set; } = "SingleChoice";
        public string ExplanationRichText { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int EstimatedSeconds { get; set; }
        public string ContentJson { get; set; } = "{}";
        public string AnswerKeyJson { get; set; } = "{}";
        public IReadOnlyCollection<string> Tags { get; set; } = Array.Empty<string>();
        public string Status { get; set; } = "Active";
        public IReadOnlyCollection<CreateQuestionAttachmentRequestDto> Attachments { get; set; } = Array.Empty<CreateQuestionAttachmentRequestDto>();
    }
}
