using examxy.Application.Features.Classrooms.DTOs;

namespace examxy.Application.Features.Classrooms
{
    public interface ITeacherRosterImportService
    {
        Task<StudentImportBatchDto> ImportStudentsAsync(
            string teacherUserId,
            Guid classId,
            ImportStudentRosterRequestDto request,
            CancellationToken cancellationToken = default);

        Task<RosterImportPreviewDto> PreviewImportAsync(
            string teacherUserId,
            Guid classId,
            ImportStudentRosterRequestDto request,
            CancellationToken cancellationToken = default);

        Task<StudentImportItemDto> AddStudentByEmailAsync(
            string teacherUserId,
            Guid classId,
            AddStudentByEmailRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
