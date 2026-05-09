using examxy.Application.Exceptions;
using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Domain.QuestionBank;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace examxy.Infrastructure.Features.QuestionBank
{
    internal sealed class NormalizedQuestionContent
    {
        public required QuestionType QuestionType { get; init; }
        public required string StemRichText { get; init; }
        public required string StemPlainText { get; init; }
        public required string ExplanationRichText { get; init; }
        public required string Difficulty { get; init; }
        public required int EstimatedSeconds { get; init; }
        public required int ContentSchemaVersion { get; init; }
        public required int AnswerKeySchemaVersion { get; init; }
        public required string RendererVersion { get; init; }
        public required string ContentJson { get; init; }
        public required string AnswerKeyJson { get; init; }
        public required string ExplanationJson { get; init; }
        public required string SearchText { get; init; }
    }

    internal static class QuestionContentNormalizer
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public static NormalizedQuestionContent Normalize(CreateQuestionRequestDto request)
        {
            var questionType = ParseQuestionType(request.QuestionType);
            var authoringMode = string.IsNullOrWhiteSpace(request.AuthoringMode)
                ? "Legacy"
                : request.AuthoringMode.Trim();

            var normalized = authoringMode.Equals("Basic", StringComparison.OrdinalIgnoreCase)
                ? NormalizeBasic(request, questionType)
                : authoringMode.Equals("Rich", StringComparison.OrdinalIgnoreCase)
                    ? NormalizeRich(request, questionType)
                    : NormalizeLegacy(request, questionType);

            QuestionContentValidator.Validate(normalized);
            return normalized;
        }

        private static NormalizedQuestionContent NormalizeBasic(
            CreateQuestionRequestDto request,
            QuestionType questionType)
        {
            var stem = Paragraph(request.StemText);
            var choices = request.Choices
                .Select((choice, index) => new
                {
                    id = NormalizeItemId(choice.Id, index),
                    content = choice.Content ?? Paragraph(choice.Text),
                    isCorrect = choice.IsCorrect
                })
                .ToArray();

            object answerKey = questionType switch
            {
                QuestionType.SingleChoice or QuestionType.MultipleChoice => (object)new
                {
                    correctChoiceIds = choices.Where(choice => choice.isCorrect).Select(choice => choice.id).ToArray()
                },
                QuestionType.TrueFalse => new { value = request.AnswerKey?.Value ?? choices.FirstOrDefault(choice => choice.isCorrect)?.id == "true" },
                _ => request.AnswerKey ?? (object)new QuestionAnswerKeyRequestDto()
            };

            var content = new
            {
                schemaVersion = QuestionBankSchemaVersions.CurrentContentSchemaVersion,
                questionType = questionType.ToString(),
                stem,
                metadata = Metadata(request),
                choices = choices.Select(choice => new { choice.id, choice.content }).ToArray(),
                leftItems = Array.Empty<object>(),
                rightItems = Array.Empty<object>(),
                items = Array.Empty<object>(),
                media = request.Media
            };

            return CreateNormalized(request, questionType, stem, content, answerKey, request.Explanation);
        }

        private static NormalizedQuestionContent NormalizeRich(
            CreateQuestionRequestDto request,
            QuestionType questionType)
        {
            var stem = request.Stem ?? Paragraph(request.StemText);
            var choices = request.Choices
                .Select((choice, index) => new
                {
                    id = NormalizeItemId(choice.Id, index),
                    content = choice.Content ?? Paragraph(choice.Text)
                })
                .ToArray();
            var leftItems = request.LeftItems
                .Select((item, index) => new { id = NormalizeItemId(item.Id, index, "L"), content = item.Content ?? Paragraph(item.Text) })
                .ToArray();
            var rightItems = request.RightItems
                .Select((item, index) => new { id = NormalizeItemId(item.Id, index, "R"), content = item.Content ?? Paragraph(item.Text) })
                .ToArray();
            var items = request.Items
                .Select((item, index) => new { id = NormalizeItemId(item.Id, index, "I"), content = item.Content ?? Paragraph(item.Text) })
                .ToArray();

            var content = new
            {
                schemaVersion = QuestionBankSchemaVersions.CurrentContentSchemaVersion,
                questionType = questionType.ToString(),
                stem,
                metadata = Metadata(request),
                choices,
                leftItems,
                rightItems,
                items,
                media = request.Media
            };

            var answerKey = request.AnswerKey ?? new QuestionAnswerKeyRequestDto();
            return CreateNormalized(request, questionType, stem, content, answerKey, request.Explanation);
        }

        private static NormalizedQuestionContent NormalizeLegacy(
            CreateQuestionRequestDto request,
            QuestionType questionType)
        {
            var stemText = !string.IsNullOrWhiteSpace(request.StemPlainText)
                ? request.StemPlainText
                : StripHtml(request.StemRichText);
            var stem = Paragraph(stemText);
            var explanationText = StripHtml(request.ExplanationRichText);
            var explanation = Paragraph(explanationText);

            var content = TryParseJson(request.ContentJson, out var parsedContent)
                ? parsedContent
                : new { raw = request.ContentJson ?? "{}" };
            var answerKey = TryParseJson(request.AnswerKeyJson, out var parsedAnswer)
                ? parsedAnswer
                : new { raw = request.AnswerKeyJson ?? "{}" };

            return new NormalizedQuestionContent
            {
                QuestionType = questionType,
                StemRichText = string.IsNullOrWhiteSpace(request.StemRichText) ? $"<p>{stemText.Trim()}</p>" : request.StemRichText,
                StemPlainText = stemText.Trim(),
                ExplanationRichText = request.ExplanationRichText ?? string.Empty,
                Difficulty = request.Difficulty?.Trim() ?? string.Empty,
                EstimatedSeconds = Math.Max(request.EstimatedSeconds, 0),
                ContentSchemaVersion = 1,
                AnswerKeySchemaVersion = 1,
                RendererVersion = "legacy-v1",
                ContentJson = Serialize(content),
                AnswerKeyJson = Serialize(answerKey),
                ExplanationJson = Serialize(explanation),
                SearchText = BuildSearchText(stem, explanation, Serialize(content), Serialize(answerKey), request.Tags)
            };
        }

        private static NormalizedQuestionContent CreateNormalized(
            CreateQuestionRequestDto request,
            QuestionType questionType,
            RichContentDocumentDto stem,
            object content,
            object answerKey,
            RichContentDocumentDto? explanation)
        {
            var explanationDocument = explanation ?? Paragraph(StripHtml(request.ExplanationRichText));
            var contentJson = Serialize(content);
            var answerKeyJson = Serialize(answerKey);
            var explanationJson = Serialize(explanationDocument);
            var stemPlainText = RichContentTextExtractor.ExtractPlainText(stem);
            var explanationText = RichContentTextExtractor.ExtractPlainText(explanationDocument);

            return new NormalizedQuestionContent
            {
                QuestionType = questionType,
                StemRichText = $"<p>{stemPlainText}</p>",
                StemPlainText = stemPlainText,
                ExplanationRichText = string.IsNullOrWhiteSpace(explanationText) ? string.Empty : $"<p>{explanationText}</p>",
                Difficulty = request.Difficulty?.Trim() ?? string.Empty,
                EstimatedSeconds = Math.Max(request.EstimatedSeconds, 0),
                ContentSchemaVersion = QuestionBankSchemaVersions.CurrentContentSchemaVersion,
                AnswerKeySchemaVersion = QuestionBankSchemaVersions.CurrentAnswerKeySchemaVersion,
                RendererVersion = QuestionBankSchemaVersions.CurrentRendererVersion,
                ContentJson = contentJson,
                AnswerKeyJson = answerKeyJson,
                ExplanationJson = explanationJson,
                SearchText = BuildSearchText(stem, explanationDocument, contentJson, answerKeyJson, request.Tags)
            };
        }

        public static RichContentDocumentDto Paragraph(string? text)
        {
            return new RichContentDocumentDto
            {
                Blocks = string.IsNullOrWhiteSpace(text)
                    ? Array.Empty<RichContentBlockDto>()
                    : new[]
                    {
                        new RichContentBlockDto
                        {
                            Type = "paragraph",
                            Inline = new[]
                            {
                                new InlineNodeDto
                                {
                                    Type = "text",
                                    Text = text.Trim()
                                }
                            }
                        }
                    }
            };
        }

        private static object Metadata(CreateQuestionRequestDto request)
        {
            return new
            {
                difficulty = request.Difficulty?.Trim() ?? string.Empty,
                estimatedSeconds = Math.Max(request.EstimatedSeconds, 0)
            };
        }

        private static QuestionType ParseQuestionType(string questionType)
        {
            if (Enum.TryParse<QuestionType>(questionType, true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Question type is invalid.",
                new Dictionary<string, string[]>
                {
                    ["questionType"] = new[] { "Unsupported question type." }
                });
        }

        private static string NormalizeItemId(string id, int index, string prefix = "")
        {
            if (!string.IsNullOrWhiteSpace(id))
            {
                return id.Trim();
            }

            return string.IsNullOrWhiteSpace(prefix)
                ? ((char)('A' + index)).ToString()
                : $"{prefix}{index + 1}";
        }

        private static bool TryParseJson(string json, out object value)
        {
            try
            {
                value = JsonSerializer.Deserialize<object>(string.IsNullOrWhiteSpace(json) ? "{}" : json, JsonOptions)
                    ?? new { };
                return true;
            }
            catch (JsonException)
            {
                value = new { };
                return false;
            }
        }

        private static string Serialize(object value)
        {
            return JsonSerializer.Serialize(value, JsonOptions);
        }

        private static string StripHtml(string? value)
        {
            return Regex.Replace(value ?? string.Empty, "<.*?>", string.Empty).Trim();
        }

        private static string BuildSearchText(
            RichContentDocumentDto stem,
            RichContentDocumentDto explanation,
            string contentJson,
            string answerKeyJson,
            IReadOnlyCollection<string> tags)
        {
            var source = string.Join(
                ' ',
                RichContentTextExtractor.ExtractSearchText(stem),
                RichContentTextExtractor.ExtractSearchText(explanation),
                contentJson,
                answerKeyJson,
                string.Join(' ', tags));

            return Regex.Replace(source.ToUpperInvariant(), "\\s+", " ").Trim();
        }
    }

    internal static class QuestionContentValidator
    {
        public static void Validate(NormalizedQuestionContent normalized)
        {
            var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(normalized.StemPlainText))
            {
                errors["stem"] = new[] { "Question stem cannot be empty." };
            }

            ValidateJsonObject(normalized.ContentJson, "contentJson", errors);
            ValidateJson(normalized.AnswerKeyJson, "answerKeyJson", errors);
            ValidateJsonObject(normalized.ExplanationJson, "explanationJson", errors);
            ValidateLatex(normalized.ContentJson, "contentJson", errors);
            ValidateLatex(normalized.ExplanationJson, "explanationJson", errors);
            ValidateQuestionTypePayload(normalized, errors);

            if (errors.Count > 0)
            {
                throw new QuestionBankContentValidationException("Question content is invalid.", errors);
            }
        }

        private static void ValidateQuestionTypePayload(
            NormalizedQuestionContent normalized,
            IDictionary<string, string[]> errors)
        {
            using var contentDocument = JsonDocument.Parse(normalized.ContentJson);
            using var answerDocument = JsonDocument.Parse(normalized.AnswerKeyJson);
            var root = contentDocument.RootElement;
            var answer = answerDocument.RootElement;

            if (normalized.ContentSchemaVersion == 1)
            {
                return;
            }

            switch (normalized.QuestionType)
            {
                case QuestionType.SingleChoice:
                    ValidateChoices(root, answer, errors, exactCorrectCount: 1);
                    break;
                case QuestionType.MultipleChoice:
                    ValidateChoices(root, answer, errors, minimumCorrectCount: 1);
                    break;
                case QuestionType.TrueFalse:
                    if (!answer.TryGetProperty("value", out var value) ||
                        value.ValueKind is not (JsonValueKind.True or JsonValueKind.False))
                    {
                        errors["answerKey.value"] = new[] { "TrueFalse answer key must be a boolean." };
                    }
                    break;
                case QuestionType.Matching:
                    ValidateMatching(root, answer, errors);
                    break;
                case QuestionType.Ordering:
                    ValidateOrdering(root, answer, errors);
                    break;
            }
        }

        private static void ValidateChoices(
            JsonElement content,
            JsonElement answer,
            IDictionary<string, string[]> errors,
            int? exactCorrectCount = null,
            int? minimumCorrectCount = null)
        {
            var choices = ReadIds(content, "choices");
            if (choices.Length < 2)
            {
                errors["choices"] = new[] { "At least 2 choices are required." };
                return;
            }

            if (choices.Length != choices.Distinct(StringComparer.OrdinalIgnoreCase).Count())
            {
                errors["choices"] = new[] { "Choice ids must be unique." };
            }

            var correctChoiceIds = ReadStringArray(answer, "correctChoiceIds");
            if (exactCorrectCount.HasValue && correctChoiceIds.Length != exactCorrectCount.Value)
            {
                errors["answerKey.correctChoiceIds"] = new[] { $"Exactly {exactCorrectCount.Value} correct choice is required." };
            }

            if (minimumCorrectCount.HasValue && correctChoiceIds.Length < minimumCorrectCount.Value)
            {
                errors["answerKey.correctChoiceIds"] = new[] { $"At least {minimumCorrectCount.Value} correct choice is required." };
            }

            var choiceSet = choices.ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (correctChoiceIds.Any(id => !choiceSet.Contains(id)))
            {
                errors["answerKey.correctChoiceIds"] = new[] { "Correct choice ids must exist in choices." };
            }
        }

        private static void ValidateMatching(
            JsonElement content,
            JsonElement answer,
            IDictionary<string, string[]> errors)
        {
            var leftIds = ReadIds(content, "leftItems");
            var rightIds = ReadIds(content, "rightItems");
            if (leftIds.Length == 0 || rightIds.Length == 0)
            {
                errors["matching"] = new[] { "Matching questions require left and right items." };
                return;
            }

            if (!answer.TryGetProperty("matches", out var matches) || matches.ValueKind != JsonValueKind.Array)
            {
                errors["answerKey.matches"] = new[] { "Matching answer key requires matches." };
                return;
            }

            var leftSet = leftIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var rightSet = rightIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var matchedLeftIds = new List<string>();
            foreach (var match in matches.EnumerateArray())
            {
                var leftId = match.TryGetProperty("leftId", out var leftValue) ? leftValue.GetString() ?? string.Empty : string.Empty;
                var rightId = match.TryGetProperty("rightId", out var rightValue) ? rightValue.GetString() ?? string.Empty : string.Empty;
                matchedLeftIds.Add(leftId);
                if (!leftSet.Contains(leftId) || !rightSet.Contains(rightId))
                {
                    errors["answerKey.matches"] = new[] { "Match ids must exist in left and right items." };
                    return;
                }
            }

            if (matchedLeftIds.Count != matchedLeftIds.Distinct(StringComparer.OrdinalIgnoreCase).Count())
            {
                errors["answerKey.matches"] = new[] { "Duplicate left ids are not allowed in matching answer key." };
            }
        }

        private static void ValidateOrdering(
            JsonElement content,
            JsonElement answer,
            IDictionary<string, string[]> errors)
        {
            var itemIds = ReadIds(content, "items");
            var orderedIds = ReadStringArray(answer, "orderedItemIds");
            if (itemIds.Length < 2)
            {
                errors["items"] = new[] { "Ordering questions require at least 2 items." };
                return;
            }

            if (!itemIds.OrderBy(id => id).SequenceEqual(orderedIds.OrderBy(id => id), StringComparer.OrdinalIgnoreCase))
            {
                errors["answerKey.orderedItemIds"] = new[] { "Ordered item ids must be a complete permutation of item ids." };
            }
        }

        private static string[] ReadIds(JsonElement root, string propertyName)
        {
            if (!root.TryGetProperty(propertyName, out var values) || values.ValueKind != JsonValueKind.Array)
            {
                return Array.Empty<string>();
            }

            return values.EnumerateArray()
                .Select(value =>
                    value.ValueKind == JsonValueKind.Object && value.TryGetProperty("id", out var id)
                        ? id.GetString() ?? string.Empty
                        : string.Empty)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToArray();
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

        private static void ValidateJsonObject(string json, string fieldName, IDictionary<string, string[]> errors)
        {
            try
            {
                using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
                if (document.RootElement.ValueKind != JsonValueKind.Object)
                {
                    errors[fieldName] = new[] { "Value must be a JSON object." };
                }
            }
            catch (JsonException)
            {
                errors[fieldName] = new[] { "Value must be valid JSON." };
            }
        }

        private static void ValidateJson(string json, string fieldName, IDictionary<string, string[]> errors)
        {
            try
            {
                JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json).Dispose();
            }
            catch (JsonException)
            {
                errors[fieldName] = new[] { "Value must be valid JSON." };
            }
        }

        private static void ValidateLatex(string json, string fieldName, IDictionary<string, string[]> errors)
        {
            using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(json) ? "{}" : json);
            foreach (var latex in FindLatexValues(document.RootElement))
            {
                if (!LatexMathSanitizer.IsSafe(latex))
                {
                    errors[fieldName] = new[] { "Math LaTeX contains unsupported commands." };
                    return;
                }
            }
        }

        private static IEnumerable<string> FindLatexValues(JsonElement element)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in element.EnumerateObject())
                {
                    if (property.NameEquals("latex") && property.Value.ValueKind == JsonValueKind.String)
                    {
                        yield return property.Value.GetString() ?? string.Empty;
                    }

                    foreach (var nested in FindLatexValues(property.Value))
                    {
                        yield return nested;
                    }
                }
            }
            else if (element.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in element.EnumerateArray())
                {
                    foreach (var nested in FindLatexValues(item))
                    {
                        yield return nested;
                    }
                }
            }
        }
    }

    internal static class RichContentTextExtractor
    {
        public static string ExtractPlainText(RichContentDocumentDto document)
        {
            return string.Join(
                " ",
                document.Blocks.Select(ExtractBlockText).Where(value => !string.IsNullOrWhiteSpace(value))).Trim();
        }

        public static string ExtractSearchText(RichContentDocumentDto document)
        {
            return string.Join(
                " ",
                document.Blocks.Select(ExtractBlockSearchText).Where(value => !string.IsNullOrWhiteSpace(value))).Trim();
        }

        private static string ExtractBlockText(RichContentBlockDto block)
        {
            return block.Type switch
            {
                "paragraph" => string.Concat(block.Inline.Select(node => node.Type == "text" ? node.Text : node.Type == "symbol" ? node.Value : string.Empty)),
                "mathBlock" => block.Latex,
                "image" => string.Join(" ", block.AltText, block.Caption).Trim(),
                "table" => string.Join(" ", block.Rows.SelectMany(row => row).Select(cell => ExtractPlainText(cell.Content))),
                "code" => block.Code,
                _ => string.Empty
            };
        }

        private static string ExtractBlockSearchText(RichContentBlockDto block)
        {
            var inline = string.Join(" ", block.Inline.Select(node => string.Join(" ", node.Text, node.Latex, node.Value)));
            return string.Join(" ", ExtractBlockText(block), inline, block.Latex, block.GraphType, string.Join(" ", block.Expressions.Select(expression => expression.Latex))).Trim();
        }
    }

    internal static class LatexMathSanitizer
    {
        private static readonly HashSet<string> AllowedCommands = new(StringComparer.Ordinal)
        {
            "frac",
            "sqrt",
            "sum",
            "int",
            "lim",
            "sin",
            "cos",
            "tan",
            "log",
            "ln",
            "alpha",
            "beta",
            "gamma",
            "delta",
            "pi",
            "theta",
            "left",
            "right",
            "cdot",
            "times",
            "leq",
            "geq",
            "neq",
            "infty"
        };

        private static readonly HashSet<string> DeniedCommands = new(StringComparer.Ordinal)
        {
            "input",
            "include",
            "write18",
            "openout",
            "read",
            "catcode",
            "def",
            "newcommand",
            "usepackage",
            "documentclass"
        };

        public static bool IsSafe(string latex)
        {
            var commands = Regex.Matches(latex ?? string.Empty, "\\\\([a-zA-Z]+|.)")
                .Select(match => match.Groups[1].Value)
                .Where(command => Regex.IsMatch(command, "^[a-zA-Z]+$"))
                .ToArray();

            return commands.All(command => !DeniedCommands.Contains(command) && AllowedCommands.Contains(command));
        }
    }

    internal static class LatexEscapeService
    {
        public static string EscapeText(string value)
        {
            var builder = new StringBuilder();
            foreach (var character in value ?? string.Empty)
            {
                builder.Append(character switch
                {
                    '\\' => "\\textbackslash{}",
                    '{' => "\\{",
                    '}' => "\\}",
                    '$' => "\\$",
                    '&' => "\\&",
                    '#' => "\\#",
                    '_' => "\\_",
                    '%' => "\\%",
                    '~' => "\\textasciitilde{}",
                    '^' => "\\textasciicircum{}",
                    _ => character.ToString()
                });
            }

            return builder.ToString();
        }
    }

    internal static class RichContentLatexRenderer
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public static string RenderDocument(RichContentDocumentDto document)
        {
            return RenderDocument(document, new LatexRenderContext(null, new Dictionary<Guid, QuestionBankAttachment>()), string.Empty);
        }

        public static string RenderDocument(RichContentDocumentDto document, LatexRenderContext context, string path)
        {
            return string.Join(
                Environment.NewLine,
                document.Blocks.Select((block, index) => RenderBlock(block, context, AppendPath(path, $"blocks[{index}]")))).Trim();
        }

        public static string RenderDocumentJson(string json, LatexRenderContext? context = null, string path = "")
        {
            try
            {
                var document = JsonSerializer.Deserialize<RichContentDocumentDto>(json, JsonOptions);
                return document is null
                    ? string.Empty
                    : RenderDocument(document, context ?? new LatexRenderContext(null, new Dictionary<Guid, QuestionBankAttachment>()), path);
            }
            catch (JsonException)
            {
                context?.AddError("InvalidRichContentJson", "Rich content JSON could not be parsed.", path);
                return LatexEscapeService.EscapeText(json);
            }
        }

        private static string RenderBlock(RichContentBlockDto block, LatexRenderContext context, string path)
        {
            return block.Type switch
            {
                "paragraph" => RenderInline(block.Inline, context, AppendPath(path, "inline")),
                "mathBlock" => RenderMathBlock(block.Latex, context, AppendPath(path, "latex")),
                "image" => RenderImage(block, context, path),
                "table" => RenderTable(block, context, path),
                "code" => $"\\begin{{verbatim}}{Environment.NewLine}{block.Code}{Environment.NewLine}\\end{{verbatim}}",
                _ => RenderUnsupportedBlock(block, context, path)
            };
        }

        private static string RenderInline(IEnumerable<InlineNodeDto> nodes, LatexRenderContext context, string path)
        {
            return string.Concat(nodes.Select((node, index) => node.Type switch
            {
                "text" => LatexEscapeService.EscapeText(node.Text),
                "mathInline" => RenderInlineMath(node.Latex, context, AppendPath(path, $"[{index}].latex")),
                "symbol" => LatexEscapeService.EscapeText(node.Value),
                _ => RenderUnsupportedInline(node, context, AppendPath(path, $"[{index}]"))
            }));
        }

        private static string RenderMathBlock(string latex, LatexRenderContext context, string path)
        {
            if (!LatexMathSanitizer.IsSafe(latex))
            {
                context.AddError("UnsafeMathLatex", "Math LaTeX contains unsupported commands.", path);
                return string.Empty;
            }

            return $"\\[{latex}\\]";
        }

        private static string RenderInlineMath(string latex, LatexRenderContext context, string path)
        {
            if (!LatexMathSanitizer.IsSafe(latex))
            {
                context.AddError("UnsafeMathLatex", "Math LaTeX contains unsupported commands.", path);
                return string.Empty;
            }

            return $"\\({latex}\\)";
        }

        private static string RenderImage(RichContentBlockDto block, LatexRenderContext context, string path)
        {
            if (!block.AttachmentId.HasValue)
            {
                context.AddError("AttachmentMissing", "Image block requires an attachment id.", AppendPath(path, "attachmentId"));
                return string.Empty;
            }

            var attachment = context.ResolveAttachment(block.AttachmentId.Value);
            if (attachment is null)
            {
                context.AddError("AttachmentNotFound", "Image attachment was not found or is not accessible.", AppendPath(path, "attachmentId"));
                return string.Empty;
            }

            if (attachment.Status == "PendingUpload")
            {
                context.AddError("AttachmentPendingUpload", "Image attachment upload is not complete.", AppendPath(path, "attachmentId"));
                return string.Empty;
            }

            if (attachment.Status == "Deleted")
            {
                context.AddError("AttachmentDeleted", "Image attachment has been deleted.", AppendPath(path, "attachmentId"));
                return string.Empty;
            }

            if (!IsSupportedImageContentType(attachment.ContentType))
            {
                context.AddError("UnsupportedAttachmentContentType", "Image attachment content type is not supported.", AppendPath(path, "attachmentId"));
                return string.Empty;
            }

            var caption = string.IsNullOrWhiteSpace(block.Caption)
                ? string.Empty
                : $"{Environment.NewLine}\\captionof{{figure}}{{{LatexEscapeService.EscapeText(block.Caption)}}}";
            var assetPath = $"attachments/{attachment.Id}{ExtensionFor(attachment)}";
            return $"\\begin{{center}}{Environment.NewLine}\\includegraphics[width=0.55\\textwidth]{{{assetPath}}}{caption}{Environment.NewLine}\\end{{center}}";
        }

        private static string RenderTable(RichContentBlockDto block, LatexRenderContext context, string path)
        {
            if (block.Rows.Count == 0)
            {
                return string.Empty;
            }

            var columnCount = block.Rows.Max(row => row.Count);
            var columns = string.Join(" ", Enumerable.Repeat("p{0.2\\textwidth}", columnCount));
            var rows = block.Rows.Select((row, rowIndex) =>
                string.Join(
                    " & ",
                    row.Select((cell, cellIndex) => RenderDocument(
                        cell.Content,
                        context,
                        AppendPath(path, $"rows[{rowIndex}][{cellIndex}].content")))) + " \\\\");
            return $"\\begin{{tabular}}{{{columns}}}{Environment.NewLine}{string.Join(Environment.NewLine, rows)}{Environment.NewLine}\\end{{tabular}}";
        }

        private static string RenderUnsupportedBlock(RichContentBlockDto block, LatexRenderContext context, string path)
        {
            context.AddWarning("UnsupportedContentBlock", $"Content block '{block.Type}' is not supported by the LaTeX renderer.", path);
            return string.Empty;
        }

        private static string RenderUnsupportedInline(InlineNodeDto node, LatexRenderContext context, string path)
        {
            context.AddWarning("UnsupportedInlineNode", $"Inline node '{node.Type}' is not supported by the LaTeX renderer.", path);
            return string.Empty;
        }

        private static bool IsSupportedImageContentType(string contentType)
        {
            return contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase) ||
                contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase) ||
                contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase);
        }

        private static string ExtensionFor(QuestionBankAttachment attachment)
        {
            var fileExtension = Path.GetExtension(attachment.FileName);
            if (!string.IsNullOrWhiteSpace(fileExtension) &&
                Regex.IsMatch(fileExtension, "^\\.[A-Za-z0-9]+$"))
            {
                return fileExtension;
            }

            return attachment.ContentType.ToLowerInvariant() switch
            {
                "image/jpeg" => ".jpg",
                "image/webp" => ".webp",
                _ => ".png"
            };
        }

        private static string AppendPath(string parent, string child)
        {
            return string.IsNullOrWhiteSpace(parent) ? child : $"{parent}.{child}";
        }
    }
}
