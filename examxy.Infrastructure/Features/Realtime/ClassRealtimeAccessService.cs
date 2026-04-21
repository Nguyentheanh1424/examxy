using examxy.Application.Features.Realtime;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Features.Realtime
{
    public sealed class ClassRealtimeAccessService : IClassRealtimeAccessService
    {
        private readonly AppDbContext _dbContext;

        public ClassRealtimeAccessService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<bool> CanAccessClassAsync(
            string userId,
            Guid classId,
            CancellationToken cancellationToken = default)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(candidate => candidate.Id == classId, cancellationToken);

            if (classroom is null)
            {
                return false;
            }

            if (string.Equals(classroom.OwnerTeacherUserId, userId, StringComparison.Ordinal))
            {
                return true;
            }

            return await _dbContext.ClassMemberships.AnyAsync(
                membership =>
                    membership.ClassId == classId &&
                    membership.StudentUserId == userId &&
                    membership.Status == ClassMembershipStatus.Active,
                cancellationToken);
        }
    }
}
