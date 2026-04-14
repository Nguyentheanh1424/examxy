using examxy.Application.Features.Classrooms.DTOs;

namespace examxy.Application.Features.Classrooms
{
    public interface IRosterImportFileParser
    {
        Task<ImportStudentRosterRequestDto> ParseAsync(
            Stream stream,
            string fileName,
            CancellationToken cancellationToken = default);
    }
}
