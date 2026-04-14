using examxy.Application.Features.Classrooms.DTOs;

namespace examxy.Application.Features.Classrooms
{
    public interface IStudentInvitationService
    {
        Task<ClaimClassInviteResultDto> ClaimInviteAsync(
            string studentUserId,
            ClaimClassInviteRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
