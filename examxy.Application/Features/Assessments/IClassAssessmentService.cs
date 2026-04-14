using examxy.Application.Features.Assessments.DTOs;

namespace examxy.Application.Features.Assessments
{
    public interface IClassAssessmentService
    {
        Task<AssessmentDto> CreateAssessmentAsync(
            string teacherUserId,
            Guid classId,
            CreateAssessmentRequestDto request,
            CancellationToken cancellationToken = default);

        Task<AssessmentDto> UpdateAssessmentAsync(
            string teacherUserId,
            Guid classId,
            Guid assessmentId,
            UpdateAssessmentRequestDto request,
            CancellationToken cancellationToken = default);

        Task<AssessmentDto> PublishAssessmentAsync(
            string teacherUserId,
            Guid classId,
            Guid assessmentId,
            PublishAssessmentRequestDto request,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<AssessmentDto>> GetClassAssessmentsAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default);

        Task<StudentAssessmentAttemptDto> StartAttemptAsync(
            string userId,
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken = default);

        Task<StudentAssessmentAttemptDto> SaveAnswersAsync(
            string userId,
            Guid classId,
            Guid attemptId,
            SaveAttemptAnswersRequestDto request,
            CancellationToken cancellationToken = default);

        Task<StudentAssessmentAttemptDto> SubmitAttemptAsync(
            string userId,
            Guid classId,
            Guid attemptId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<StudentAssessmentAttemptDto>> GetAssessmentResultsAsync(
            string teacherUserId,
            Guid classId,
            Guid assessmentId,
            CancellationToken cancellationToken = default);
    }
}
