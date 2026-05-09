using examxy.Application.Features.QuestionBank.DTOs;
using examxy.Domain.QuestionBank;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace examxy.Infrastructure.Features.QuestionBank
{
    internal static class QuestionBankImportParser
    {
        private static readonly Regex LetterChoiceRegex = new(
            "^\\s*([A-Ha-h])\\s*[\\.)]\\s+(.+)$",
            RegexOptions.Compiled);

        private static readonly Regex LatexChoiceRegex = new(
            "^\\s*\\\\choice\\s+(.+)$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        private static readonly Regex InlineMathRegex = new(
            "\\\\\\((.+?)\\\\\\)|\\$(.+?)\\$",
            RegexOptions.Compiled);

        public static PreviewQuestionImportResponseDto Parse(PreviewQuestionImportRequestDto request)
        {
            var warnings = new List<QuestionBankImportDiagnosticDto>();
            var errors = new List<QuestionBankImportDiagnosticDto>();
            var questionType = ParseQuestionType(request.QuestionType, errors);
            var draft = CreateEmptyDraft(questionType);

            if (!string.Equals(request.SourceFormat?.Trim(), "LatexText", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add(Diagnostic(
                    "UnsupportedSourceFormat",
                    "Only LatexText import preview is supported.",
                    "sourceFormat"));
            }

            if (string.IsNullOrWhiteSpace(request.RawText))
            {
                errors.Add(Diagnostic(
                    "RawTextRequired",
                    "Paste one question before parsing.",
                    "rawText"));
            }

            if (errors.Count == 0)
            {
                draft = questionType switch
                {
                    QuestionType.SingleChoice => ParseChoiceQuestion(request.RawText, questionType, warnings, errors),
                    QuestionType.MultipleChoice => ParseChoiceQuestion(request.RawText, questionType, warnings, errors),
                    QuestionType.TrueFalse => ParseTrueFalseQuestion(request.RawText, warnings, errors),
                    _ => CreateEmptyDraft(questionType)
                };
            }

            return new PreviewQuestionImportResponseDto
            {
                Status = errors.Count > 0
                    ? "Failed"
                    : warnings.Count > 0
                        ? "ParsedWithWarnings"
                        : "Parsed",
                QuestionType = questionType.ToString(),
                Draft = draft,
                Warnings = warnings,
                Errors = errors
            };
        }

        private static CreateQuestionRequestDto ParseChoiceQuestion(
            string rawText,
            QuestionType questionType,
            ICollection<QuestionBankImportDiagnosticDto> warnings,
            ICollection<QuestionBankImportDiagnosticDto> errors)
        {
            var lines = SplitLines(rawText);
            var stemLines = new List<string>();
            var explanationLines = new List<string>();
            var choices = new List<ParsedChoice>();
            var answerText = string.Empty;
            var inExplanation = false;

            for (var lineIndex = 0; lineIndex < lines.Length; lineIndex++)
            {
                var line = lines[lineIndex];
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed))
                {
                    continue;
                }

                if (TryReadLabeledValue(trimmed, "dap an", out var answer))
                {
                    answerText = answer;
                    inExplanation = false;
                    continue;
                }

                if (TryReadLabeledValue(trimmed, "loi giai", out var explanationStart))
                {
                    inExplanation = true;
                    if (!string.IsNullOrWhiteSpace(explanationStart))
                    {
                        explanationLines.Add(explanationStart);
                    }

                    continue;
                }

                if (inExplanation)
                {
                    explanationLines.Add(trimmed);
                    continue;
                }

                var letterChoice = LetterChoiceRegex.Match(trimmed);
                if (letterChoice.Success)
                {
                    choices.Add(new ParsedChoice(
                        letterChoice.Groups[1].Value.ToUpperInvariant(),
                        letterChoice.Groups[2].Value.Trim()));
                    continue;
                }

                var latexChoice = LatexChoiceRegex.Match(trimmed);
                if (latexChoice.Success)
                {
                    choices.Add(new ParsedChoice(
                        ChoiceIdForIndex(choices.Count),
                        latexChoice.Groups[1].Value.Trim()));
                    continue;
                }

                if (choices.Count == 0)
                {
                    stemLines.Add(RemoveQuestionPrefix(trimmed));
                    continue;
                }

                warnings.Add(Diagnostic(
                    "UnrecognizedLine",
                    "This line was not recognized after choices started.",
                    $"rawText.lines[{lineIndex}]"));
            }

            if (stemLines.Count == 0)
            {
                errors.Add(Diagnostic("StemRequired", "Question stem could not be parsed.", "stem"));
            }

            if (choices.Count < 2)
            {
                errors.Add(Diagnostic("ChoicesRequired", "At least 2 choices are required.", "choices"));
            }

            if (choices.Select(choice => choice.Id).Distinct(StringComparer.OrdinalIgnoreCase).Count() != choices.Count)
            {
                errors.Add(Diagnostic("DuplicateChoiceId", "Choice labels must be unique.", "choices"));
            }

            var answerIds = ParseChoiceAnswerIds(answerText, questionType, choices, warnings);
            if (answerIds.Count == 0)
            {
                warnings.Add(Diagnostic(
                    "AnswerKeyMissing",
                    "Answer key was not detected. Select the correct answer in the editor before saving.",
                    "answerKey"));
            }

            if (questionType == QuestionType.SingleChoice && answerIds.Count > 1)
            {
                warnings.Add(Diagnostic(
                    "SingleChoiceAnswerTrimmed",
                    "Only the first detected answer was kept for SingleChoice.",
                    "answerKey.correctChoiceIds"));
                answerIds = answerIds.Take(1).ToArray();
            }

            return new CreateQuestionRequestDto
            {
                AuthoringMode = "Rich",
                QuestionType = questionType.ToString(),
                Stem = RichDocumentFromText(string.Join(Environment.NewLine, stemLines)),
                StemText = string.Join(Environment.NewLine, stemLines).Trim(),
                Choices = choices.Select(choice => new QuestionChoiceRequestDto
                {
                    Id = choice.Id,
                    Text = choice.Text,
                    Content = RichDocumentFromText(choice.Text),
                    IsCorrect = answerIds.Contains(choice.Id, StringComparer.OrdinalIgnoreCase)
                }).ToArray(),
                AnswerKey = new QuestionAnswerKeyRequestDto
                {
                    CorrectChoiceIds = answerIds
                },
                Explanation = RichDocumentFromText(string.Join(Environment.NewLine, explanationLines)),
                Difficulty = "Medium",
                EstimatedSeconds = 60,
                ContentJson = "{}",
                AnswerKeyJson = "{}",
                Tags = Array.Empty<string>(),
                Attachments = Array.Empty<CreateQuestionAttachmentRequestDto>()
            };
        }

        private static CreateQuestionRequestDto ParseTrueFalseQuestion(
            string rawText,
            ICollection<QuestionBankImportDiagnosticDto> warnings,
            ICollection<QuestionBankImportDiagnosticDto> errors)
        {
            var lines = SplitLines(rawText);
            var stemLines = new List<string>();
            var explanationLines = new List<string>();
            string? answerText = null;
            var inExplanation = false;

            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed))
                {
                    continue;
                }

                if (TryReadLabeledValue(trimmed, "dap an", out var answer))
                {
                    answerText = answer;
                    inExplanation = false;
                    continue;
                }

                if (TryReadLabeledValue(trimmed, "loi giai", out var explanationStart))
                {
                    inExplanation = true;
                    if (!string.IsNullOrWhiteSpace(explanationStart))
                    {
                        explanationLines.Add(explanationStart);
                    }

                    continue;
                }

                if (inExplanation)
                {
                    explanationLines.Add(trimmed);
                }
                else
                {
                    stemLines.Add(RemoveStatementPrefix(RemoveQuestionPrefix(trimmed)));
                }
            }

            if (stemLines.Count == 0)
            {
                errors.Add(Diagnostic("StemRequired", "Question stem could not be parsed.", "stem"));
            }

            var value = ParseTrueFalseAnswer(answerText, warnings);
            return new CreateQuestionRequestDto
            {
                AuthoringMode = "Rich",
                QuestionType = QuestionType.TrueFalse.ToString(),
                Stem = RichDocumentFromText(string.Join(Environment.NewLine, stemLines)),
                StemText = string.Join(Environment.NewLine, stemLines).Trim(),
                AnswerKey = new QuestionAnswerKeyRequestDto
                {
                    Value = value
                },
                Explanation = RichDocumentFromText(string.Join(Environment.NewLine, explanationLines)),
                Difficulty = "Medium",
                EstimatedSeconds = 60,
                ContentJson = "{}",
                AnswerKeyJson = "{}",
                Tags = Array.Empty<string>(),
                Attachments = Array.Empty<CreateQuestionAttachmentRequestDto>()
            };
        }

        private static QuestionType ParseQuestionType(
            string questionType,
            ICollection<QuestionBankImportDiagnosticDto> errors)
        {
            if (Enum.TryParse<QuestionType>(questionType, true, out var parsed) &&
                parsed is QuestionType.SingleChoice or QuestionType.MultipleChoice or QuestionType.TrueFalse)
            {
                return parsed;
            }

            errors.Add(Diagnostic(
                "UnsupportedQuestionType",
                "Import preview supports SingleChoice, MultipleChoice, and TrueFalse.",
                "questionType"));
            return QuestionType.SingleChoice;
        }

        private static IReadOnlyCollection<string> ParseChoiceAnswerIds(
            string answerText,
            QuestionType questionType,
            IReadOnlyCollection<ParsedChoice> choices,
            ICollection<QuestionBankImportDiagnosticDto> warnings)
        {
            if (string.IsNullOrWhiteSpace(answerText))
            {
                return Array.Empty<string>();
            }

            var compact = Regex.Replace(answerText.ToUpperInvariant(), "[^A-H]", string.Empty);
            var ids = compact.Select(letter => letter.ToString())
                .Where(id => choices.Any(choice => string.Equals(choice.Id, id, StringComparison.OrdinalIgnoreCase)))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (ids.Length == 0)
            {
                warnings.Add(Diagnostic(
                    "AnswerKeyUnmatched",
                    "Detected answer text did not match any choice label.",
                    "answerKey"));
            }

            return questionType == QuestionType.SingleChoice ? ids.Take(1).ToArray() : ids;
        }

        private static bool? ParseTrueFalseAnswer(
            string? answerText,
            ICollection<QuestionBankImportDiagnosticDto> warnings)
        {
            if (string.IsNullOrWhiteSpace(answerText))
            {
                warnings.Add(Diagnostic(
                    "AnswerKeyMissing",
                    "Answer key was not detected. Select True or False in the editor before saving.",
                    "answerKey.value"));
                return null;
            }

            var normalized = NormalizeForLabel(answerText);
            if (normalized.Contains("dung", StringComparison.OrdinalIgnoreCase) ||
                normalized.Contains("true", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (normalized.Contains("sai", StringComparison.OrdinalIgnoreCase) ||
                normalized.Contains("false", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            warnings.Add(Diagnostic(
                "AnswerKeyUnmatched",
                "Detected answer text was not recognized as True or False.",
                "answerKey.value"));
            return null;
        }

        private static bool TryReadLabeledValue(string line, string normalizedLabel, out string value)
        {
            value = string.Empty;
            var separatorIndex = line.IndexOf(':');
            if (separatorIndex < 0)
            {
                separatorIndex = line.IndexOf('：');
            }

            if (separatorIndex < 0)
            {
                return false;
            }

            var label = NormalizeForLabel(line[..separatorIndex]);
            if (!label.Equals(normalizedLabel, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            value = line[(separatorIndex + 1)..].Trim();
            return true;
        }

        private static CreateQuestionRequestDto CreateEmptyDraft(QuestionType questionType)
        {
            return new CreateQuestionRequestDto
            {
                AuthoringMode = "Rich",
                QuestionType = questionType.ToString(),
                Stem = new RichContentDocumentDto(),
                Explanation = new RichContentDocumentDto(),
                AnswerKey = new QuestionAnswerKeyRequestDto(),
                Difficulty = "Medium",
                EstimatedSeconds = 60,
                ContentJson = "{}",
                AnswerKeyJson = "{}",
                Tags = Array.Empty<string>(),
                Attachments = Array.Empty<CreateQuestionAttachmentRequestDto>()
            };
        }

        private static RichContentDocumentDto RichDocumentFromText(string text)
        {
            var blocks = text.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrWhiteSpace(line))
                .Select(line => new RichContentBlockDto
                {
                    Type = "paragraph",
                    Inline = InlineNodesFromText(line)
                })
                .ToArray();

            return new RichContentDocumentDto
            {
                SchemaVersion = QuestionBankSchemaVersions.CurrentContentSchemaVersion,
                Blocks = blocks
            };
        }

        private static IReadOnlyCollection<InlineNodeDto> InlineNodesFromText(string text)
        {
            var nodes = new List<InlineNodeDto>();
            var cursor = 0;
            foreach (Match match in InlineMathRegex.Matches(text))
            {
                if (match.Index > cursor)
                {
                    nodes.Add(new InlineNodeDto
                    {
                        Type = "text",
                        Text = text[cursor..match.Index]
                    });
                }

                nodes.Add(new InlineNodeDto
                {
                    Type = "mathInline",
                    Latex = (match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value).Trim()
                });
                cursor = match.Index + match.Length;
            }

            if (cursor < text.Length)
            {
                nodes.Add(new InlineNodeDto
                {
                    Type = "text",
                    Text = text[cursor..]
                });
            }

            return nodes.Count > 0
                ? nodes
                : new[] { new InlineNodeDto { Type = "text", Text = text } };
        }

        private static string[] SplitLines(string rawText)
        {
            return rawText.Replace("\r\n", "\n", StringComparison.Ordinal)
                .Replace('\r', '\n')
                .Split('\n');
        }

        private static string RemoveQuestionPrefix(string value)
        {
            return Regex.Replace(
                value,
                "^\\s*\\S+\\s*\\d+\\s*[\\.:\\)\\-]\\s*",
                string.Empty,
                RegexOptions.IgnoreCase);
        }

        private static string RemoveStatementPrefix(string value)
        {
            var separatorIndex = value.IndexOf(':');
            if (separatorIndex < 0)
            {
                return Regex.Replace(
                    value,
                    "^\\s*statement\\s*\\-\\s*",
                    string.Empty,
                    RegexOptions.IgnoreCase);
            }

            return NormalizeForLabel(value[..separatorIndex]).Equals("menh de", StringComparison.OrdinalIgnoreCase)
                ? value[(separatorIndex + 1)..].Trim()
                : value;
        }

        private static string ChoiceIdForIndex(int index)
        {
            return ((char)('A' + index)).ToString();
        }

        private static string NormalizeForLabel(string value)
        {
            var decomposed = value.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder();
            foreach (var character in decomposed)
            {
                var category = CharUnicodeInfo.GetUnicodeCategory(character);
                if (category != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(character);
                }
            }

            return Regex.Replace(
                builder.ToString()
                    .Replace('đ', 'd')
                    .Replace('Đ', 'D')
                    .Normalize(NormalizationForm.FormC)
                    .ToLowerInvariant(),
                "\\s+",
                " ").Trim();
        }

        private static QuestionBankImportDiagnosticDto Diagnostic(
            string code,
            string message,
            string path)
        {
            return new QuestionBankImportDiagnosticDto
            {
                Code = code,
                Message = message,
                Path = path
            };
        }

        private sealed record ParsedChoice(string Id, string Text);
    }
}
