using examxy.Application.Features.QuestionBank;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace examxy.Infrastructure.Features.QuestionBank
{
    public sealed class QuestionBankExportWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<QuestionBankExportWorker> _logger;
        private readonly QuestionBankPdfExportOptions _options;

        public QuestionBankExportWorker(
            IServiceScopeFactory scopeFactory,
            IOptions<QuestionBankPdfExportOptions> options,
            ILogger<QuestionBankExportWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _options = options.Value;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var pollInterval = TimeSpan.FromSeconds(Math.Max(_options.PollIntervalSeconds, 1));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var processor = scope.ServiceProvider.GetRequiredService<IQuestionBankExportProcessor>();
                    var processed = await processor.ProcessNextQueuedJobAsync(stoppingToken);
                    if (processed is not null)
                    {
                        _logger.LogInformation(
                            "Question bank export job processed. exportJobId={ExportJobId} status={Status}",
                            processed.ExportJobId,
                            processed.Status);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception, "Question bank export worker cycle failed.");
                }

                await Task.Delay(pollInterval, stoppingToken);
            }
        }
    }
}
