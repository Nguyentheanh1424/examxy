using examxy.Application.Abstractions.Classrooms.DTOs;

namespace examxy.Application.Abstractions.Classrooms
{
    public interface IStudentInvitationService
    {
        Task<ClaimClassInviteResultDto> ClaimInviteAsync(
            string studentUserId,
            ClaimClassInviteRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
