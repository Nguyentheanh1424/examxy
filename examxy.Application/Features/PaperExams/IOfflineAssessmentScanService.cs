using examxy.Application.Features.PaperExams.DTOs;

namespace examxy.Application.Features.PaperExams
{
    public interface IOfflineAssessmentScanService
    {
        Task<AssessmentScanSubmissionDto> SubmitScanAsync(string studentUserId, Guid classId, Guid assessmentId, SubmitOfflineAssessmentScanRequestDto request, CancellationToken cancellationToken = default);
        Task<AssessmentScanSubmissionDto?> GetMySubmissionAsync(string studentUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken = default);
        Task<IReadOnlyCollection<AssessmentScanSubmissionDto>> GetSubmissionsAsync(string teacherUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken = default);
        Task<AssessmentScanSubmissionDto> GetSubmissionAsync(string teacherUserId, Guid classId, Guid assessmentId, Guid submissionId, CancellationToken cancellationToken = default);
        Task<AssessmentScanSubmissionDto> ReviewSubmissionAsync(string teacherUserId, Guid classId, Guid assessmentId, Guid submissionId, ReviewOfflineAssessmentScanRequestDto request, CancellationToken cancellationToken = default);
        Task<AssessmentScanSubmissionDto> FinalizeSubmissionAsync(string teacherUserId, Guid classId, Guid assessmentId, Guid submissionId, CancellationToken cancellationToken = default);
    }
}
