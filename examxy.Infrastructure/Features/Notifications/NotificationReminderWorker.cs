using examxy.Application.Features.Notifications;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace examxy.Infrastructure.Features.Notifications
{
    public sealed class NotificationReminderWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificationReminderWorker> _logger;
        private readonly NotificationReminderOptions _options;

        public NotificationReminderWorker(
            IServiceScopeFactory scopeFactory,
            IOptions<NotificationReminderOptions> options,
            ILogger<NotificationReminderWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _options = options.Value;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var pollInterval = TimeSpan.FromSeconds(_options.PollIntervalSeconds);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var processor = scope.ServiceProvider.GetRequiredService<INotificationReminderProcessor>();
                    var result = await processor.ProcessDueRemindersAsync(stoppingToken);

                    _logger.LogInformation(
                        "Notification reminder cycle completed. scanned={ItemsScanned} recipients={RecipientsEvaluated} created={CreatedCount} skipped={SkippedExistingCount} errors={ErrorCount}",
                        result.ItemsScanned,
                        result.RecipientsEvaluated,
                        result.CreatedCount,
                        result.SkippedExistingCount,
                        result.ErrorCount);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception exception)
                {
                    _logger.LogError(exception, "Notification reminder cycle failed.");
                }

                await Task.Delay(pollInterval, stoppingToken);
            }
        }
    }
}
