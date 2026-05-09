namespace examxy.Application.Features.QuestionBank
{
    public interface IQuestionBankAttachmentStorage
    {
        Task<(string StorageKey, string ContentHash)> SaveAsync(
            string teacherUserId,
            Guid attachmentId,
            string fileName,
            string contentType,
            Stream content,
            CancellationToken cancellationToken = default);

        Task<QuestionBankStoredAttachment> OpenReadAsync(
            string storageKey,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(
            string storageKey,
            CancellationToken cancellationToken = default);
    }

    public sealed class QuestionBankStoredAttachment
    {
        public required Stream Content { get; init; }
        public required string FileName { get; init; }
        public required string ContentType { get; init; }
    }
}
