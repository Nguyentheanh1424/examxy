using examxy.Application.Abstractions.Classrooms.DTOs;
using examxy.Application.Abstractions.Identity.DTOs;

namespace examxy.Application.Abstractions.Classrooms
{
    public interface IStudentOnboardingService
    {
        Task<AuthResponseDto> RegisterStudentAsync(
            StudentRegisterRequestDto request,
            CancellationToken cancellationToken = default);

        Task<StudentDashboardDto> GetDashboardAsync(
            string studentUserId,
            CancellationToken cancellationToken = default);
    }
}
