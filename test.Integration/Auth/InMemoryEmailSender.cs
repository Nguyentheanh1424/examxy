using examxy.Application.Abstractions.Email;

namespace test.Integration.Auth
{
    public sealed class InMemoryEmailSender : IEmailSender
    {
        private readonly List<EmailMessage> _messages = new();
        private readonly object _sync = new();

        public Task SendAsync(EmailMessage message, CancellationToken ct = default)
        {
            lock (_sync)
            {
                _messages.Add(new EmailMessage
                {
                    To = message.To,
                    Subject = message.Subject,
                    HtmlBody = message.HtmlBody,
                    TextBody = message.TextBody
                });
            }

            return Task.CompletedTask;
        }

        public IReadOnlyList<EmailMessage> GetMessages()
        {
            lock (_sync)
            {
                return _messages.ToArray();
            }
        }

        public void Clear()
        {
            lock (_sync)
            {
                _messages.Clear();
            }
        }
    }
}
