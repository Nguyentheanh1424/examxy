using examxy.Application.Abstractions.Classrooms.DTOs;

namespace examxy.Application.Abstractions.Classrooms
{
    public interface ITeacherRosterImportService
    {
        Task<StudentImportBatchDto> ImportStudentsAsync(
            string teacherUserId,
            Guid classId,
            ImportStudentRosterRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
