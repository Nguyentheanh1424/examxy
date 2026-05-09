using examxy.Application.Features.QuestionBank.DTOs;

namespace examxy.Application.Features.QuestionBank
{
    public interface IQuestionBankService
    {
        Task<QuestionDto> CreateQuestionAsync(
            string teacherUserId,
            CreateQuestionRequestDto request,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<QuestionDto>> GetQuestionsAsync(
            string teacherUserId,
            CancellationToken cancellationToken = default);

        Task<QuestionBankPagedResultDto> SearchQuestionsAsync(
            string teacherUserId,
            QuestionBankQueryDto query,
            CancellationToken cancellationToken = default);

        Task<QuestionDto> GetQuestionAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyCollection<QuestionVersionDto>> GetQuestionVersionsAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken = default);

        Task<QuestionVersionDto> GetQuestionVersionAsync(
            string teacherUserId,
            Guid questionId,
            int versionNumber,
            CancellationToken cancellationToken = default);

        Task<QuestionDto> UpdateQuestionAsync(
            string teacherUserId,
            Guid questionId,
            UpdateQuestionRequestDto request,
            CancellationToken cancellationToken = default);

        Task DeleteQuestionAsync(
            string teacherUserId,
            Guid questionId,
            CancellationToken cancellationToken = default);

        QuestionBankCapabilitiesDto GetCapabilities();

        Task<PreviewLatexResponseDto> PreviewLatexAsync(
            string teacherUserId,
            PreviewLatexRequestDto request,
            CancellationToken cancellationToken = default);

        Task<PreviewQuestionImportResponseDto> PreviewQuestionImportAsync(
            string teacherUserId,
            PreviewQuestionImportRequestDto request,
            CancellationToken cancellationToken = default);

        Task<QuestionBankExportJobDto> CreatePdfExportAsync(
            string teacherUserId,
            CreateQuestionBankExportRequestDto request,
            CancellationToken cancellationToken = default);

        Task<QuestionBankExportJobDto> GetExportJobAsync(
            string teacherUserId,
            Guid exportJobId,
            CancellationToken cancellationToken = default);

        Task<QuestionBankAttachmentFileDto> OpenExportFileAsync(
            string teacherUserId,
            Guid exportJobId,
            Guid fileId,
            CancellationToken cancellationToken = default);

        Task<CreateQuestionBankAttachmentUploadUrlResponseDto> CreateAttachmentUploadUrlAsync(
            string teacherUserId,
            CreateQuestionBankAttachmentUploadUrlRequestDto request,
            CancellationToken cancellationToken = default);

        Task<QuestionAttachmentDto> CompleteAttachmentUploadAsync(
            string teacherUserId,
            CompleteQuestionBankAttachmentUploadRequestDto request,
            CancellationToken cancellationToken = default);

        Task<QuestionAttachmentDto> GetAttachmentAsync(
            string teacherUserId,
            Guid attachmentId,
            CancellationToken cancellationToken = default);

        Task<QuestionBankAttachmentFileDto> OpenAttachmentAsync(
            string teacherUserId,
            Guid attachmentId,
            CancellationToken cancellationToken = default);

        Task DeleteAttachmentAsync(
            string teacherUserId,
            Guid attachmentId,
            CancellationToken cancellationToken = default);
    }
}
