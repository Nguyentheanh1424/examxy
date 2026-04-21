namespace examxy.Application.Features.Realtime
{
    public interface IClassRealtimeAccessService
    {
        Task<bool> CanAccessClassAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default);
    }
}
