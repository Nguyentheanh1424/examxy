namespace examxy.Application.Features.PaperExams
{
    public interface IPaperExamStorage
    {
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
    }
}
