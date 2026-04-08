using examxy.Application.Abstractions.Classrooms.DTOs;

namespace examxy.Application.Abstractions.Classrooms
{
    public interface ITeacherClassService
    {
        Task<TeacherClassSummaryDto> CreateClassAsync(
            string teacherUserId,
            CreateTeacherClassRequestDto request,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<TeacherClassSummaryDto>> GetClassesAsync(
            string teacherUserId,
            CancellationToken cancellationToken = default);

        Task<TeacherClassDetailDto> GetClassAsync(
            string teacherUserId,
            Guid classId,
            CancellationToken cancellationToken = default);

        Task<TeacherClassSummaryDto> UpdateClassAsync(
            string teacherUserId,
            Guid classId,
            UpdateTeacherClassRequestDto request,
            CancellationToken cancellationToken = default);

        Task DeleteClassAsync(
            string teacherUserId,
            Guid classId,
            CancellationToken cancellationToken = default);
    }
}
