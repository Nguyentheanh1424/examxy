using examxy.Application.Features.QuestionBank;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using System.ComponentModel;
using System.Diagnostics;
using System.Text;

namespace examxy.Infrastructure.Features.QuestionBank
{
    public sealed class QuestionBankPdfCompiler : IQuestionBankPdfCompiler
    {
        private readonly QuestionBankPdfExportOptions _options;
        private readonly string _workRootPath;

        public QuestionBankPdfCompiler(
            IHostEnvironment hostEnvironment,
            IOptions<QuestionBankPdfExportOptions> options)
        {
            _options = options.Value;
            _workRootPath = Path.IsPathRooted(_options.WorkRootPath)
                ? Path.GetFullPath(_options.WorkRootPath)
                : Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, _options.WorkRootPath));
        }

        public async Task<QuestionBankPdfCompileResult> CompileAsync(
            string latexDocument,
            IReadOnlyCollection<QuestionBankPdfCompilerAsset> assets,
            CancellationToken cancellationToken = default)
        {
            var workingDirectory = Path.Combine(_workRootPath, Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(workingDirectory);

            try
            {
                await File.WriteAllTextAsync(
                    Path.Combine(workingDirectory, "main.tex"),
                    latexDocument,
                    new UTF8Encoding(encoderShouldEmitUTF8Identifier: false),
                    cancellationToken);

                foreach (var asset in assets)
                {
                    var assetPath = ResolveAssetPath(workingDirectory, asset.RelativePath);
                    Directory.CreateDirectory(Path.GetDirectoryName(assetPath)!);
                    await File.WriteAllBytesAsync(assetPath, asset.Content, cancellationToken);
                }

                return await RunCompilerAsync(workingDirectory, cancellationToken);
            }
            finally
            {
                TryDeleteDirectory(workingDirectory);
            }
        }

        private async Task<QuestionBankPdfCompileResult> RunCompilerAsync(
            string workingDirectory,
            CancellationToken cancellationToken)
        {
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Max(_options.TimeoutSeconds, 1)));

            var output = new StringBuilder();
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = string.IsNullOrWhiteSpace(_options.CompilerPath) ? "xelatex" : _options.CompilerPath,
                    Arguments = "-no-shell-escape -interaction=nonstopmode -halt-on-error main.tex",
                    WorkingDirectory = workingDirectory,
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                },
                EnableRaisingEvents = true
            };

            try
            {
                process.Start();
            }
            catch (Win32Exception exception)
            {
                return new QuestionBankPdfCompileResult
                {
                    Succeeded = false,
                    ErrorCode = "PdfCompilerUnavailable",
                    ErrorMessage = "PDF compiler executable was not found.",
                    Log = exception.Message
                };
            }

            var standardOutput = process.StandardOutput.ReadToEndAsync();
            var standardError = process.StandardError.ReadToEndAsync();

            try
            {
                await process.WaitForExitAsync(timeoutCts.Token);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                TryKill(process);
                return new QuestionBankPdfCompileResult
                {
                    Succeeded = false,
                    ErrorCode = "PdfCompileTimeout",
                    ErrorMessage = "PDF compilation timed out.",
                    Log = await ReadCompilerLogAsync(workingDirectory, output.ToString(), standardOutput, standardError)
                };
            }

            output.AppendLine(await standardOutput);
            output.AppendLine(await standardError);
            var log = await ReadCompilerLogAsync(
                workingDirectory,
                output.ToString(),
                Task.FromResult(string.Empty),
                Task.FromResult(string.Empty));
            var pdfPath = Path.Combine(workingDirectory, "main.pdf");
            if (process.ExitCode != 0 || !File.Exists(pdfPath))
            {
                return new QuestionBankPdfCompileResult
                {
                    Succeeded = false,
                    ErrorCode = "PdfCompileFailed",
                    ErrorMessage = "PDF compilation failed.",
                    Log = log
                };
            }

            return new QuestionBankPdfCompileResult
            {
                Succeeded = true,
                PdfBytes = await File.ReadAllBytesAsync(pdfPath, cancellationToken),
                Log = log
            };
        }

        private static async Task<string> ReadCompilerLogAsync(
            string workingDirectory,
            string fallback,
            Task<string> standardOutput,
            Task<string> standardError)
        {
            var logPath = Path.Combine(workingDirectory, "main.log");
            if (File.Exists(logPath))
            {
                return await File.ReadAllTextAsync(logPath);
            }

            var builder = new StringBuilder(fallback);
            builder.AppendLine(await standardOutput);
            builder.AppendLine(await standardError);
            return builder.ToString();
        }

        private static string ResolveAssetPath(string workingDirectory, string relativePath)
        {
            var candidate = Path.GetFullPath(Path.Combine(workingDirectory, relativePath));
            var root = Path.GetFullPath(workingDirectory);
            if (!candidate.StartsWith(root, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Compiler asset path is invalid.");
            }

            return candidate;
        }

        private static void TryKill(Process process)
        {
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                }
            }
            catch (InvalidOperationException)
            {
            }
        }

        private static void TryDeleteDirectory(string directory)
        {
            try
            {
                if (Directory.Exists(directory))
                {
                    Directory.Delete(directory, recursive: true);
                }
            }
            catch (IOException)
            {
            }
            catch (UnauthorizedAccessException)
            {
            }
        }
    }
}
