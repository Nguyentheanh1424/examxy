namespace examxy.Application.Features.Realtime
{
    public interface IRealtimeEventPublisher
    {
        Task PublishToUserAsync(
            string recipientUserId,
            string eventType,
            string? actorUserId,
            object? payload,
            CancellationToken cancellationToken = default);

        Task PublishToClassAsync(
            Guid classId,
            string eventType,
            string? actorUserId,
            object? payload,
            CancellationToken cancellationToken = default);
    }
}
