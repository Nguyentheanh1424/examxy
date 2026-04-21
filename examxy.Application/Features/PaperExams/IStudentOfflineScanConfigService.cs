using examxy.Application.Features.PaperExams.DTOs;

namespace examxy.Application.Features.PaperExams
{
    public interface IStudentOfflineScanConfigService
    {
        Task<StudentOfflineScanConfigDto> GetScanConfigAsync(string studentUserId, Guid classId, Guid assessmentId, CancellationToken cancellationToken = default);
    }
}
