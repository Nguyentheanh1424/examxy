using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Domain.QuestionBank;
using System.Text;
using System.Text.Json;

namespace examxy.Infrastructure.Features.QuestionBank
{
    internal sealed class RenderedQuestionLatex
    {
        public required string Fragment { get; init; }
        public IReadOnlyCollection<QuestionBankRenderDiagnosticDto> Warnings { get; init; } = Array.Empty<QuestionBankRenderDiagnosticDto>();
        public IReadOnlyCollection<QuestionBankRenderDiagnosticDto> Errors { get; init; } = Array.Empty<QuestionBankRenderDiagnosticDto>();
    }

    internal static class QuestionLatexRenderer
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public static RenderedQuestionLatex Render(
            QuestionBankQuestionVersion version,
            bool includeAnswers,
            bool includeExplanations,
            IReadOnlyDictionary<Guid, QuestionBankAttachment>? attachments = null)
        {
            var context = new LatexRenderContext(version.Id, attachments ?? new Dictionary<Guid, QuestionBankAttachment>());
            if (version.ContentSchemaVersion == 1)
            {
                return RenderLegacy(version, includeAnswers, includeExplanations);
            }

            using var contentDocument = JsonDocument.Parse(version.ContentJson);
            using var answerDocument = JsonDocument.Parse(version.AnswerKeyJson);
            var root = contentDocument.RootElement;
            var answer = answerDocument.RootElement;
            var stem = TryReadRichContent(root, "stem");
            var builder = new StringBuilder();
            builder.Append("\\question ");
            builder.AppendLine(stem is null ? LatexEscapeService.EscapeText(version.StemPlainText) : RichContentLatexRenderer.RenderDocument(stem, context, "stem"));

            switch (version.QuestionType)
            {
                case QuestionType.SingleChoice:
                case QuestionType.MultipleChoice:
                    RenderChoices(builder, root, answer, includeAnswers, context);
                    break;
                case QuestionType.TrueFalse:
                    builder.AppendLine();
                    builder.AppendLine("\\begin{choices}");
                    RenderBooleanChoice(builder, "true", "ÄÃºng", answer, includeAnswers);
                    RenderBooleanChoice(builder, "false", "Sai", answer, includeAnswers);
                    builder.AppendLine("\\end{choices}");
                    break;
                case QuestionType.Matching:
                    RenderMatching(builder, root, context);
                    break;
                case QuestionType.Ordering:
                    RenderOrdering(builder, root, context);
                    break;
                case QuestionType.MediaBased:
                    context.AddWarning(
                        "UnsupportedQuestionLayout",
                        $"{version.QuestionType} currently renders as a manual-answer space.",
                        "questionType");
                    builder.AppendLine();
                    builder.AppendLine("\\vspace{4cm}");
                    break;
            }

            if (includeExplanations && !string.IsNullOrWhiteSpace(version.ExplanationJson))
            {
                builder.AppendLine();
                builder.AppendLine("\\par\\textbf{Loi giai.} " + RichContentLatexRenderer.RenderDocumentJson(version.ExplanationJson, context, "explanation"));
            }

            return new RenderedQuestionLatex
            {
                Fragment = builder.ToString().Trim(),
                Warnings = context.Warnings,
                Errors = context.Errors
            };
        }

        public static string BuildExamDocument(
            string title,
            IEnumerable<string> fragments,
            QuestionBankExportOptionsDto options)
        {
            var paperSize = string.Equals(options.PaperSize, "Letter", StringComparison.OrdinalIgnoreCase)
                ? "letterpaper"
                : "a4paper";

            var builder = new StringBuilder();
            builder.AppendLine($"\\documentclass[12pt,{paperSize}]{{exam}}");
            builder.AppendLine("\\usepackage{fontspec}");
            builder.AppendLine("\\usepackage{polyglossia}");
            builder.AppendLine("\\setdefaultlanguage{vietnamese}");
            builder.AppendLine("\\setmainfont{Times New Roman}");
            builder.AppendLine("\\usepackage{amsmath,amssymb}");
            builder.AppendLine("\\usepackage{graphicx}");
            builder.AppendLine("\\usepackage{enumitem}");
            builder.AppendLine("\\usepackage{geometry}");
            builder.AppendLine("\\usepackage{tikz}");
            builder.AppendLine("\\usepackage{pgfplots}");
            builder.AppendLine("\\geometry{margin=2cm}");
            builder.AppendLine("\\pgfplotsset{compat=1.18}");
            builder.AppendLine();
            builder.AppendLine("\\begin{document}");
            builder.AppendLine();
            builder.AppendLine("\\begin{center}");
            builder.AppendLine($"  {{\\Large \\textbf{{ {LatexEscapeService.EscapeText(title)} }}}}\\\\");
            builder.AppendLine("\\end{center}");
            builder.AppendLine();
            builder.AppendLine("\\begin{questions}");
            builder.AppendLine(string.Join(Environment.NewLine + Environment.NewLine, fragments));
            builder.AppendLine("\\end{questions}");
            builder.AppendLine();
            builder.AppendLine("\\end{document}");
            return builder.ToString();
        }

        private static RenderedQuestionLatex RenderLegacy(
            QuestionBankQuestionVersion version,
            bool includeAnswers,
            bool includeExplanations)
        {
            var builder = new StringBuilder();
            builder.Append("\\question ");
            builder.AppendLine(LatexEscapeService.EscapeText(version.StemPlainText));

            if (includeAnswers)
            {
                builder.AppendLine();
                builder.Append("\\par\\textbf{ÄÃ¡p Ã¡n.} ");
                builder.AppendLine(LatexEscapeService.EscapeText(version.AnswerKeyJson));
            }

            if (includeExplanations && !string.IsNullOrWhiteSpace(version.ExplanationRichText))
            {
                builder.AppendLine();
                builder.Append("\\par\\textbf{Lá»i giáº£i.} ");
                builder.AppendLine(LatexEscapeService.EscapeText(version.ExplanationRichText));
            }

            return new RenderedQuestionLatex
            {
                Fragment = builder.ToString().Trim(),
                Warnings = new[]
                {
                    new QuestionBankRenderDiagnosticDto
                    {
                        QuestionVersionId = version.Id,
                        Code = "LegacyContentRendered",
                        Message = "Legacy question content was rendered as escaped text.",
                        Path = "contentJson"
                    }
                }
            };
        }

        private static void RenderChoices(
            StringBuilder builder,
            JsonElement root,
            JsonElement answer,
            bool includeAnswers,
            LatexRenderContext context)
        {
            var correctChoiceIds = ReadStringArray(answer, "correctChoiceIds")
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (!root.TryGetProperty("choices", out var choices) || choices.ValueKind != JsonValueKind.Array)
            {
                return;
            }

            builder.AppendLine();
            builder.AppendLine("\\begin{choices}");
            foreach (var choice in choices.EnumerateArray())
            {
                var id = choice.TryGetProperty("id", out var idValue) ? idValue.GetString() ?? string.Empty : string.Empty;
                var content = TryReadRichContent(choice, "content");
                builder.Append(includeAnswers && correctChoiceIds.Contains(id) ? "  \\CorrectChoice " : "  \\choice ");
                builder.AppendLine(content is null ? LatexEscapeService.EscapeText(id) : RichContentLatexRenderer.RenderDocument(content, context, $"choices[{id}].content"));
            }

            builder.AppendLine("\\end{choices}");
        }

        private static void RenderBooleanChoice(
            StringBuilder builder,
            string value,
            string label,
            JsonElement answer,
            bool includeAnswers)
        {
            var isCorrect = answer.TryGetProperty("value", out var answerValue) &&
                string.Equals(answerValue.GetRawText().Trim('"'), value, StringComparison.OrdinalIgnoreCase);
            builder.Append(includeAnswers && isCorrect ? "  \\CorrectChoice " : "  \\choice ");
            builder.AppendLine(LatexEscapeService.EscapeText(label));
        }

        private static void RenderMatching(StringBuilder builder, JsonElement root, LatexRenderContext context)
        {
            var leftItems = ReadContentItems(root, "leftItems", context);
            var rightItems = ReadContentItems(root, "rightItems", context);
            builder.AppendLine();
            builder.AppendLine("\\begin{tabular}{p{0.45\\textwidth} p{0.45\\textwidth}}");
            builder.AppendLine("\\textbf{Cá»™t A} & \\textbf{Cá»™t B} \\\\");
            var rows = Math.Max(leftItems.Count, rightItems.Count);
            for (var index = 0; index < rows; index += 1)
            {
                var left = index < leftItems.Count ? $"{index + 1}. {leftItems[index]}" : string.Empty;
                var right = index < rightItems.Count ? $"{(char)('A' + index)}. {rightItems[index]}" : string.Empty;
                builder.AppendLine($"{left} & {right} \\\\");
            }

            builder.AppendLine("\\end{tabular}");
        }

        private static void RenderOrdering(StringBuilder builder, JsonElement root, LatexRenderContext context)
        {
            var items = ReadContentItems(root, "items", context);
            builder.AppendLine();
            builder.AppendLine("\\begin{enumerate}[label=\\Alph*.]");
            foreach (var item in items)
            {
                builder.AppendLine($"  \\item {item}");
            }

            builder.AppendLine("\\end{enumerate}");
        }

        private static List<string> ReadContentItems(JsonElement root, string propertyName, LatexRenderContext context)
        {
            if (!root.TryGetProperty(propertyName, out var values) || values.ValueKind != JsonValueKind.Array)
            {
                return new List<string>();
            }

            return values.EnumerateArray()
                .Select((value, index) => new { Content = TryReadRichContent(value, "content"), Index = index })
                .Where(value => value.Content is not null)
                .Select(value => RichContentLatexRenderer.RenderDocument(value.Content!, context, $"{propertyName}[{value.Index}].content"))
                .ToList();
        }

        private static RichContentDocumentDto? TryReadRichContent(JsonElement root, string propertyName)
        {
            if (!root.TryGetProperty(propertyName, out var value) || value.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            return JsonSerializer.Deserialize<RichContentDocumentDto>(value.GetRawText(), JsonOptions);
        }

        private static string[] ReadStringArray(JsonElement root, string propertyName)
        {
            if (!root.TryGetProperty(propertyName, out var values) || values.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<string>();
            }

            return values.EnumerateArray()
                .Select(value => value.ValueKind == JsonValueKind.String ? value.GetString() ?? string.Empty : value.GetRawText())
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToArray();
        }
    }

    internal sealed class LatexRenderContext
    {
        private readonly IReadOnlyDictionary<Guid, QuestionBankAttachment> _attachments;
        private readonly List<QuestionBankRenderDiagnosticDto> _warnings = new();
        private readonly List<QuestionBankRenderDiagnosticDto> _errors = new();

        public LatexRenderContext(Guid? questionVersionId, IReadOnlyDictionary<Guid, QuestionBankAttachment> attachments)
        {
            QuestionVersionId = questionVersionId;
            _attachments = attachments;
        }

        public Guid? QuestionVersionId { get; }

        public IReadOnlyCollection<QuestionBankRenderDiagnosticDto> Warnings => _warnings;

        public IReadOnlyCollection<QuestionBankRenderDiagnosticDto> Errors => _errors;

        public QuestionBankAttachment? ResolveAttachment(Guid attachmentId)
        {
            return _attachments.TryGetValue(attachmentId, out var attachment) ? attachment : null;
        }

        public void AddWarning(string code, string message, string path)
        {
            _warnings.Add(CreateDiagnostic(code, message, path));
        }

        public void AddError(string code, string message, string path)
        {
            _errors.Add(CreateDiagnostic(code, message, path));
        }

        private QuestionBankRenderDiagnosticDto CreateDiagnostic(string code, string message, string path)
        {
            return new QuestionBankRenderDiagnosticDto
            {
                QuestionVersionId = QuestionVersionId,
                Code = code,
                Message = message,
                Path = path
            };
        }
    }
}
