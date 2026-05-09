namespace examxy.Application.Features.QuestionBank
{
    public interface IQuestionBankPdfCompiler
    {
        Task<QuestionBankPdfCompileResult> CompileAsync(
            string latexDocument,
            IReadOnlyCollection<QuestionBankPdfCompilerAsset> assets,
            CancellationToken cancellationToken = default);
    }

    public sealed class QuestionBankPdfCompilerAsset
    {
        public required string RelativePath { get; init; }
        public required byte[] Content { get; init; }
    }

    public sealed class QuestionBankPdfCompileResult
    {
        public bool Succeeded { get; init; }
        public byte[] PdfBytes { get; init; } = Array.Empty<byte>();
        public string Log { get; init; } = string.Empty;
        public string ErrorCode { get; init; } = string.Empty;
        public string ErrorMessage { get; init; } = string.Empty;
    }
}
