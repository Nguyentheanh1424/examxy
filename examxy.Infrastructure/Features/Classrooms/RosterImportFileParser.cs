using ClosedXML.Excel;
using examxy.Application.Features.Classrooms;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Application.Exceptions;
using Microsoft.VisualBasic.FileIO;

namespace examxy.Infrastructure.Features.Classrooms
{
    public sealed class RosterImportFileParser : IRosterImportFileParser
    {
        public Task<ImportStudentRosterRequestDto> ParseAsync(
            Stream stream,
            string fileName,
            CancellationToken cancellationToken = default)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".xlsx" => Task.FromResult(ParseXlsx(stream, fileName)),
                ".csv" => Task.FromResult(ParseCsv(stream, fileName)),
                _ => throw CreateValidationException(
                    "Unsupported roster file format.",
                    "Only .xlsx and .csv files are supported.")
            };
        }

        private static ImportStudentRosterRequestDto ParseXlsx(Stream stream, string fileName)
        {
            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheets.FirstOrDefault();
            if (worksheet is null)
            {
                throw CreateValidationException(
                    "Roster file is empty.",
                    "No worksheet was found in the uploaded file.");
            }

            var usedRange = worksheet.RangeUsed();
            if (usedRange is null || usedRange.RowCount() < 2)
            {
                throw CreateValidationException(
                    "Roster file has no data rows.",
                    "The roster file must include a header row and at least one student row.");
            }

            var headerRow = usedRange.Row(1);
            var headers = headerRow.Cells()
                .ToDictionary(
                    cell => NormalizeHeader(cell.GetString()),
                    cell => cell.Address.ColumnNumber);

            var emailColumn = FindRequiredColumn(headers, "email");
            var fullNameColumn = FindOptionalColumn(headers, "fullname");
            var studentCodeColumn = FindOptionalColumn(headers, "studentcode");

            var students = new List<StudentRosterItemInputDto>();
            foreach (var row in usedRange.Rows().Skip(1))
            {
                var email = row.Cell(emailColumn).GetString().Trim();
                if (string.IsNullOrWhiteSpace(email))
                {
                    continue;
                }

                var fullName = fullNameColumn.HasValue
                    ? row.Cell(fullNameColumn.Value).GetString().Trim()
                    : string.Empty;

                var studentCode = studentCodeColumn.HasValue
                    ? row.Cell(studentCodeColumn.Value).GetString().Trim()
                    : string.Empty;

                students.Add(new StudentRosterItemInputDto
                {
                    FullName = fullName,
                    StudentCode = studentCode,
                    Email = email
                });
            }

            if (students.Count == 0)
            {
                throw CreateValidationException(
                    "Roster file has no valid rows.",
                    "At least one row with a non-empty email is required.");
            }

            return new ImportStudentRosterRequestDto
            {
                SourceFileName = fileName,
                Students = students
            };
        }

        private static ImportStudentRosterRequestDto ParseCsv(Stream stream, string fileName)
        {
            using var parser = new TextFieldParser(stream);
            parser.SetDelimiters(",");
            parser.HasFieldsEnclosedInQuotes = true;
            parser.TrimWhiteSpace = false;

            if (parser.EndOfData)
            {
                throw CreateValidationException(
                    "Roster file is empty.",
                    "The roster file must include a header row.");
            }

            var headerFields = parser.ReadFields();
            if (headerFields is null || headerFields.Length == 0)
            {
                throw CreateValidationException(
                    "Roster header is invalid.",
                    "Could not read header columns from CSV file.");
            }

            var headers = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < headerFields.Length; i++)
            {
                var normalized = NormalizeHeader(headerFields[i]);
                if (!string.IsNullOrWhiteSpace(normalized) && !headers.ContainsKey(normalized))
                {
                    headers[normalized] = i;
                }
            }

            var emailColumn = FindRequiredColumn(headers, "email");
            var fullNameColumn = FindOptionalColumn(headers, "fullname");
            var studentCodeColumn = FindOptionalColumn(headers, "studentcode");

            var students = new List<StudentRosterItemInputDto>();
            while (!parser.EndOfData)
            {
                var fields = parser.ReadFields();
                if (fields is null || fields.Length == 0)
                {
                    continue;
                }

                var email = GetValue(fields, emailColumn);
                if (string.IsNullOrWhiteSpace(email))
                {
                    continue;
                }

                students.Add(new StudentRosterItemInputDto
                {
                    FullName = fullNameColumn.HasValue ? GetValue(fields, fullNameColumn.Value) : string.Empty,
                    StudentCode = studentCodeColumn.HasValue ? GetValue(fields, studentCodeColumn.Value) : string.Empty,
                    Email = email
                });
            }

            if (students.Count == 0)
            {
                throw CreateValidationException(
                    "Roster file has no valid rows.",
                    "At least one row with a non-empty email is required.");
            }

            return new ImportStudentRosterRequestDto
            {
                SourceFileName = fileName,
                Students = students
            };
        }

        private static string GetValue(IReadOnlyList<string> fields, int index)
        {
            return index < fields.Count ? fields[index].Trim() : string.Empty;
        }

        private static int FindRequiredColumn(IDictionary<string, int> headers, string key)
        {
            if (headers.TryGetValue(key, out var index))
            {
                return index;
            }

            throw CreateValidationException(
                "Roster header is missing required columns.",
                "The roster file must include an 'email' column.");
        }

        private static int? FindOptionalColumn(IDictionary<string, int> headers, string key)
        {
            return headers.TryGetValue(key, out var index) ? index : null;
        }

        private static string NormalizeHeader(string raw)
        {
            return raw
                .Trim()
                .Replace(" ", string.Empty, StringComparison.Ordinal)
                .Replace("_", string.Empty, StringComparison.Ordinal)
                .ToLowerInvariant();
        }

        private static ValidationException CreateValidationException(string message, string detail)
        {
            return new ValidationException(
                message,
                new Dictionary<string, string[]>
                {
                    ["file"] = new[] { detail }
                });
        }
    }
}
