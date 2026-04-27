using examxy.Application.Features.Notifications;
using examxy.Infrastructure.Features.Notifications;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace test.Integration.Auth
{
    public sealed class NotificationReminderWorkerTests
    {
        [Fact]
        public async Task StartAsync_LogsProcessingSummaryAfterSuccessfulCycle()
        {
            var logger = new ListLogger<NotificationReminderWorker>();
            var processor = new FakeReminderProcessor(new NotificationReminderProcessingResult
            {
                ItemsScanned = 2,
                RecipientsEvaluated = 3,
                CreatedCount = 2,
                SkippedExistingCount = 1,
                ErrorCount = 0
            });

            await using var provider = BuildProvider(processor);
            var worker = CreateWorker(provider, logger);

            await worker.StartAsync(CancellationToken.None);
            await processor.WaitForInvocationAsync();
            await worker.StopAsync(CancellationToken.None);

            Assert.Contains(
                logger.Entries,
                entry =>
                    entry.Level == LogLevel.Information &&
                    entry.Message.Contains("Notification reminder cycle completed.", StringComparison.Ordinal) &&
                    entry.Message.Contains("scanned=2", StringComparison.Ordinal) &&
                    entry.Message.Contains("recipients=3", StringComparison.Ordinal) &&
                    entry.Message.Contains("created=2", StringComparison.Ordinal) &&
                    entry.Message.Contains("skipped=1", StringComparison.Ordinal) &&
                    entry.Message.Contains("errors=0", StringComparison.Ordinal));
        }

        [Fact]
        public async Task StartAsync_LogsErrorWhenCycleFails()
        {
            var logger = new ListLogger<NotificationReminderWorker>();
            var processor = new ThrowingReminderProcessor();

            await using var provider = BuildProvider(processor);
            var worker = CreateWorker(provider, logger);

            await worker.StartAsync(CancellationToken.None);
            await processor.WaitForInvocationAsync();
            await worker.StopAsync(CancellationToken.None);

            Assert.Contains(
                logger.Entries,
                entry =>
                    entry.Level == LogLevel.Error &&
                    entry.Message.Contains("Notification reminder cycle failed.", StringComparison.Ordinal) &&
                    entry.Exception is InvalidOperationException);
        }

        private static ServiceProvider BuildProvider(INotificationReminderProcessor processor)
        {
            var services = new ServiceCollection();
            services.AddScoped(_ => processor);
            return services.BuildServiceProvider();
        }

        private static NotificationReminderWorker CreateWorker(
            ServiceProvider provider,
            ILogger<NotificationReminderWorker> logger)
        {
            return new NotificationReminderWorker(
                provider.GetRequiredService<IServiceScopeFactory>(),
                Options.Create(new NotificationReminderOptions
                {
                    Enabled = true,
                    LeadTimeHours = 24,
                    PollIntervalSeconds = 3600,
                    LookbackMinutes = 10,
                    BatchSize = 200
                }),
                logger);
        }

        private sealed class FakeReminderProcessor : INotificationReminderProcessor
        {
            private readonly NotificationReminderProcessingResult _result;
            private readonly TaskCompletionSource<bool> _invoked = new(TaskCreationOptions.RunContinuationsAsynchronously);

            public FakeReminderProcessor(NotificationReminderProcessingResult result)
            {
                _result = result;
            }

            public Task WaitForInvocationAsync()
            {
                return _invoked.Task;
            }

            public Task<NotificationReminderProcessingResult> ProcessDueRemindersAsync(
                CancellationToken cancellationToken = default)
            {
                _invoked.TrySetResult(true);
                return Task.FromResult(_result);
            }
        }

        private sealed class ThrowingReminderProcessor : INotificationReminderProcessor
        {
            private readonly TaskCompletionSource<bool> _invoked = new(TaskCreationOptions.RunContinuationsAsynchronously);

            public Task WaitForInvocationAsync()
            {
                return _invoked.Task;
            }

            public Task<NotificationReminderProcessingResult> ProcessDueRemindersAsync(
                CancellationToken cancellationToken = default)
            {
                _invoked.TrySetResult(true);
                throw new InvalidOperationException("processor failed");
            }
        }

        private sealed class ListLogger<T> : ILogger<T>
        {
            public List<LogEntry> Entries { get; } = new();

            public IDisposable BeginScope<TState>(TState state)
                where TState : notnull
            {
                return NullScope.Instance;
            }

            public bool IsEnabled(LogLevel logLevel)
            {
                return true;
            }

            public void Log<TState>(
                LogLevel logLevel,
                EventId eventId,
                TState state,
                Exception? exception,
                Func<TState, Exception?, string> formatter)
            {
                Entries.Add(new LogEntry(logLevel, formatter(state, exception), exception));
            }

            public sealed record LogEntry(LogLevel Level, string Message, Exception? Exception);

            private sealed class NullScope : IDisposable
            {
                public static NullScope Instance { get; } = new();

                public void Dispose()
                {
                }
            }
        }
    }
}
