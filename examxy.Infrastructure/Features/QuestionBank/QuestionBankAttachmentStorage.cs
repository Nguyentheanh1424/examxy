using examxy.Application.Features.QuestionBank;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;

namespace examxy.Infrastructure.Features.QuestionBank
{
    public sealed class LocalQuestionBankAttachmentStorage : IQuestionBankAttachmentStorage
    {
        private readonly string _rootPath;

        public LocalQuestionBankAttachmentStorage(
            IHostEnvironment hostEnvironment,
            IOptions<QuestionBankAttachmentStorageOptions> options)
        {
            var configuredRootPath = options.Value.RootPath;
            _rootPath = Path.IsPathRooted(configuredRootPath)
                ? Path.GetFullPath(configuredRootPath)
                : Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, configuredRootPath));
        }

        public Task<(string StorageKey, string ContentHash)> SaveAsync(
            string teacherUserId,
            Guid attachmentId,
            string fileName,
            string contentType,
            Stream content,
            CancellationToken cancellationToken = default)
        {
            var directory = Path.Combine(_rootPath, SanitizePathSegment(teacherUserId), attachmentId.ToString("N"));
            return SaveCoreAsync(directory, fileName, content, cancellationToken);
        }

        public Task<QuestionBankStoredAttachment> OpenReadAsync(
            string storageKey,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var resolvedPath = ResolveStoragePath(storageKey);
            var stream = new FileStream(
                resolvedPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                bufferSize: 4096,
                useAsync: true);

            return Task.FromResult(new QuestionBankStoredAttachment
            {
                Content = stream,
                FileName = Path.GetFileName(resolvedPath),
                ContentType = DetectContentType(resolvedPath)
            });
        }

        public Task DeleteAsync(
            string storageKey,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (string.IsNullOrWhiteSpace(storageKey))
            {
                return Task.CompletedTask;
            }

            var resolvedPath = ResolveStoragePath(storageKey);
            if (File.Exists(resolvedPath))
            {
                File.Delete(resolvedPath);
            }

            return Task.CompletedTask;
        }

        private static async Task<(string StorageKey, string ContentHash)> SaveCoreAsync(
            string directory,
            string fileName,
            Stream content,
            CancellationToken cancellationToken)
        {
            Directory.CreateDirectory(directory);

            var safeFileName = $"{Guid.NewGuid():N}-{SanitizePathSegment(string.IsNullOrWhiteSpace(fileName) ? "attachment.bin" : fileName)}";
            var fullPath = Path.Combine(directory, safeFileName);

            await using var output = File.Create(fullPath);
            using var hasher = SHA256.Create();
            await using var cryptoStream = new CryptoStream(output, hasher, CryptoStreamMode.Write);
            await content.CopyToAsync(cryptoStream, cancellationToken);
            await cryptoStream.FlushAsync(cancellationToken);
            cryptoStream.FlushFinalBlock();
            var hash = Convert.ToHexString(hasher.Hash ?? Array.Empty<byte>());

            return (fullPath, hash);
        }

        private string ResolveStoragePath(string storageKey)
        {
            var fullRootPath = Path.GetFullPath(_rootPath);
            var candidatePath = Path.IsPathRooted(storageKey)
                ? storageKey
                : Path.Combine(_rootPath, storageKey);
            var fullCandidatePath = Path.GetFullPath(candidatePath);

            if (!fullCandidatePath.StartsWith(fullRootPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Question bank attachment storage key is invalid.");
            }

            return fullCandidatePath;
        }

        private static string SanitizePathSegment(string value)
        {
            foreach (var invalidChar in Path.GetInvalidFileNameChars())
            {
                value = value.Replace(invalidChar, '-');
            }

            return value;
        }

        private static string DetectContentType(string path)
        {
            return Path.GetExtension(path).ToLowerInvariant() switch
            {
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                ".pdf" => "application/pdf",
                _ => "application/octet-stream"
            };
        }
    }
}
