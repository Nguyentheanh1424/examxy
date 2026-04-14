using examxy.Application.Features.ClassContent.DTOs;

namespace examxy.Application.Features.ClassContent
{
    public interface IClassContentService
    {
        Task<ClassDashboardDto> GetClassDashboardAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<ClassFeedItemDto>> GetFeedAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<ClassMentionCandidateDto>> GetMentionCandidatesAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default);

        Task<ClassPostDto> CreatePostAsync(
            string userId,
            Guid classId,
            CreateClassPostRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ClassPostDto> UpdatePostAsync(
            string userId,
            Guid classId,
            Guid postId,
            UpdateClassPostRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ClassCommentDto> CreateCommentAsync(
            string userId,
            Guid classId,
            Guid postId,
            CreateClassCommentRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ClassCommentDto> UpdateCommentAsync(
            string userId,
            Guid classId,
            Guid commentId,
            UpdateClassCommentRequestDto request,
            CancellationToken cancellationToken = default);

        Task HideCommentAsync(
            string userId,
            Guid classId,
            Guid commentId,
            CancellationToken cancellationToken = default);

        Task<ClassReactionSummaryDto> SetPostReactionAsync(
            string userId,
            Guid classId,
            Guid postId,
            SetReactionRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ClassReactionSummaryDto> SetCommentReactionAsync(
            string userId,
            Guid classId,
            Guid commentId,
            SetReactionRequestDto request,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<ClassScheduleItemDto>> GetScheduleItemsAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default);

        Task<ClassScheduleItemDto> CreateScheduleItemAsync(
            string userId,
            Guid classId,
            CreateClassScheduleItemRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ClassScheduleItemDto> UpdateScheduleItemAsync(
            string userId,
            Guid classId,
            Guid scheduleItemId,
            UpdateClassScheduleItemRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
