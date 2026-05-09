using examxy.Application.Features.QuestionBank.DTOs;

namespace examxy.Application.Features.QuestionBank
{
    public interface IQuestionBankExportProcessor
    {
        Task<QuestionBankExportJobDto?> ProcessNextQueuedJobAsync(
            CancellationToken cancellationToken = default);

        Task<QuestionBankExportJobDto> ProcessJobAsync(
            Guid exportJobId,
            CancellationToken cancellationToken = default);
    }
}
