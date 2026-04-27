using examxy.Application.Exceptions;
using examxy.Application.Features.Realtime;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace examxy.Server.Realtime
{
    [Authorize]
    public sealed class RealtimeHub : Hub
    {
        private readonly IClassRealtimeAccessService _classRealtimeAccessService;

        public RealtimeHub(IClassRealtimeAccessService classRealtimeAccessService)
        {
            _classRealtimeAccessService = classRealtimeAccessService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetRequiredUserId();
            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroupNames.ForUser(userId));
            await base.OnConnectedAsync();
        }

        public Task SubscribeClass(Guid classId)
        {
            return SubscribeClassCoreAsync(classId);
        }

        public Task UnsubscribeClass(Guid classId)
        {
            return Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroupNames.ForClass(classId));
        }

        private async Task SubscribeClassCoreAsync(Guid classId)
        {
            var userId = GetRequiredUserId();
            var canAccess = await _classRealtimeAccessService.CanAccessClassAsync(userId, classId);

            if (!canAccess)
            {
                throw new HubException("You do not have access to this class.");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroupNames.ForClass(classId));
        }

        private string GetRequiredUserId()
        {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? Context.User?.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new UnauthorizedException("Authentication is required.");
            }

            return userId;
        }
    }
}
