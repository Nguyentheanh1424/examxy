using examxy.Application.Features.Realtime;
using examxy.Application.Features.Realtime.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace examxy.Server.Realtime
{
    public sealed class SignalRRealtimeEventPublisher : IRealtimeEventPublisher
    {
        private readonly IHubContext<RealtimeHub> _hubContext;

        public SignalRRealtimeEventPublisher(IHubContext<RealtimeHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public Task PublishToUserAsync(
            string recipientUserId,
            string eventType,
            string? actorUserId,
            object? payload,
            CancellationToken cancellationToken = default)
        {
            var envelope = BuildEnvelope(
                eventType,
                RealtimeScopes.User,
                classId: null,
                actorUserId,
                payload);

            return _hubContext.Clients
                .Group(RealtimeGroupNames.ForUser(recipientUserId))
                .SendAsync(RealtimeClientMethods.ReceiveRealtimeEvent, envelope, cancellationToken);
        }

        public Task PublishToClassAsync(
            Guid classId,
            string eventType,
            string? actorUserId,
            object? payload,
            CancellationToken cancellationToken = default)
        {
            var envelope = BuildEnvelope(
                eventType,
                RealtimeScopes.Class,
                classId,
                actorUserId,
                payload);

            return _hubContext.Clients
                .Group(RealtimeGroupNames.ForClass(classId))
                .SendAsync(RealtimeClientMethods.ReceiveRealtimeEvent, envelope, cancellationToken);
        }

        private static RealtimeEventEnvelopeDto BuildEnvelope(
            string eventType,
            string scope,
            Guid? classId,
            string? actorUserId,
            object? payload)
        {
            return new RealtimeEventEnvelopeDto
            {
                EventId = Guid.NewGuid(),
                EventType = eventType,
                OccurredAtUtc = DateTime.UtcNow,
                Scope = scope,
                ClassId = classId,
                ActorUserId = actorUserId,
                Payload = payload
            };
        }
    }
}
