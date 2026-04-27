namespace examxy.Application.Features.PaperExams
{
    public interface IPaperExamStorage
    {
        Task<(string StoragePath, string ContentHash)> CopyTemplateAssetAsync(
            Guid templateId,
            Guid versionId,
            string sourceStoragePath,
            CancellationToken cancellationToken = default);

        Task<(string StoragePath, string ContentHash)> SaveTemplateAssetAsync(
            Guid templateId,
            Guid versionId,
            string fileName,
            string contentType,
            Stream content,
            CancellationToken cancellationToken = default);

        Task<(string StoragePath, string ContentHash)> SaveSubmissionImageAsync(
            Guid assessmentId,
            string studentUserId,
            string fileName,
            string contentType,
            Stream content,
            CancellationToken cancellationToken = default);

        Task<(string StoragePath, string ContentHash)> SaveArtifactAsync(
            Guid submissionId,
            string artifactName,
            string contentType,
            Stream content,
            CancellationToken cancellationToken = default);

        Task<PaperExamStoredFile> OpenReadAsync(
            string storagePath,
            CancellationToken cancellationToken = default);
    }

    public sealed class PaperExamStoredFile
    {
        public required Stream Content { get; init; }
        public required string FileName { get; init; }
        public required string ContentType { get; init; }
    }
}
