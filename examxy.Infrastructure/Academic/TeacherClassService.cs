using examxy.Application.Abstractions.Classrooms;
using examxy.Application.Abstractions.Classrooms.DTOs;
using examxy.Application.Exceptions;
using examxy.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Academic
{
    public sealed class TeacherClassService : ITeacherClassService
    {
        private readonly AppDbContext _dbContext;

        public TeacherClassService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<TeacherClassSummaryDto> CreateClassAsync(
            string teacherUserId,
            CreateTeacherClassRequestDto request,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);

            var normalizedCode = await EnsureUniqueClassCodeAsync(
                string.IsNullOrWhiteSpace(request.Code)
                    ? AcademicCodeFactory.GenerateClassCode(request.Name)
                    : NormalizeClassCode(request.Code),
                cancellationToken);

            var entity = new Classroom
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                Code = normalizedCode,
                OwnerTeacherUserId = teacherUserId,
                Status = ClassStatus.Active,
                CreatedAtUtc = DateTime.UtcNow
            };

            _dbContext.Classes.Add(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return MapSummary(entity, 0, 0);
        }

        public async Task<IReadOnlyCollection<TeacherClassSummaryDto>> GetClassesAsync(
            string teacherUserId,
            CancellationToken cancellationToken = default)
        {
            await EnsureTeacherExistsAsync(teacherUserId, cancellationToken);

            return await _dbContext.Classes
                .Where(@class => @class.OwnerTeacherUserId == teacherUserId)
                .OrderByDescending(@class => @class.CreatedAtUtc)
                .Select(@class => new TeacherClassSummaryDto
                {
                    Id = @class.Id,
                    Name = @class.Name,
                    Code = @class.Code,
                    Status = @class.Status.ToString(),
                    CreatedAtUtc = @class.CreatedAtUtc,
                    ActiveStudentCount = @class.Memberships.Count(membership => membership.Status == ClassMembershipStatus.Active),
                    PendingInviteCount = @class.Invites.Count(invite => invite.Status == ClassInviteStatus.Pending && invite.ExpiresAtUtc > DateTime.UtcNow)
                })
                .ToArrayAsync(cancellationToken);
        }

        public async Task<TeacherClassDetailDto> GetClassAsync(
            string teacherUserId,
            Guid classId,
            CancellationToken cancellationToken = default)
        {
            var entity = await LoadOwnedClassAsync(teacherUserId, classId, cancellationToken);

            return new TeacherClassDetailDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Code = entity.Code,
                Status = entity.Status.ToString(),
                CreatedAtUtc = entity.CreatedAtUtc,
                Memberships = entity.Memberships
                    .OrderByDescending(membership => membership.JoinedAtUtc)
                    .Select(membership => new ClassMembershipDto
                    {
                        Id = membership.Id,
                        StudentUserId = membership.StudentUserId,
                        StudentUserName = membership.StudentUser.UserName ?? string.Empty,
                        StudentFullName = membership.StudentUser.FullName,
                        Email = membership.StudentUser.Email ?? string.Empty,
                        StudentCode = membership.StudentUser.StudentProfile?.StudentCode ?? string.Empty,
                        Status = membership.Status.ToString(),
                        JoinedAtUtc = membership.JoinedAtUtc
                    })
                    .ToArray(),
                Invites = entity.Invites
                    .OrderByDescending(invite => invite.SentAtUtc)
                    .Select(invite => new ClassInviteDto
                    {
                        Id = invite.Id,
                        Email = invite.Email,
                        Status = invite.Status.ToString(),
                        SentAtUtc = invite.SentAtUtc,
                        ExpiresAtUtc = invite.ExpiresAtUtc,
                        UsedAtUtc = invite.UsedAtUtc,
                        StudentUserId = invite.StudentUserId ?? string.Empty,
                        UsedByUserId = invite.UsedByUserId ?? string.Empty
                    })
                    .ToArray(),
                ImportBatches = entity.ImportBatches
                    .OrderByDescending(batch => batch.CreatedAtUtc)
                    .Select(batch => new StudentImportBatchDto
                    {
                        Id = batch.Id,
                        ClassId = batch.ClassId,
                        SourceFileName = batch.SourceFileName,
                        CreatedAtUtc = batch.CreatedAtUtc,
                        TotalRows = batch.TotalRows,
                        CreatedAccountCount = batch.CreatedAccountCount,
                        SentInviteCount = batch.SentInviteCount,
                        SkippedCount = batch.SkippedCount,
                        RejectedCount = batch.RejectedCount,
                        Items = batch.Items
                            .OrderBy(item => item.RowNumber)
                            .Select(item => new StudentImportItemDto
                            {
                                Id = item.Id,
                                RowNumber = item.RowNumber,
                                FullName = item.FullName,
                                StudentCode = item.StudentCode,
                                Email = item.Email,
                                ResultType = item.ResultType.ToString(),
                                Message = item.Message,
                                StudentUserId = item.StudentUserId ?? string.Empty,
                                ClassInviteId = item.ClassInviteId
                            })
                            .ToArray()
                    })
                    .ToArray()
            };
        }

        public async Task<TeacherClassSummaryDto> UpdateClassAsync(
            string teacherUserId,
            Guid classId,
            UpdateTeacherClassRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var entity = await _dbContext.Classes
                .FirstOrDefaultAsync(
                    @class => @class.Id == classId && @class.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (entity is null)
            {
                throw new NotFoundException("Class not found.");
            }

            var normalizedCode = NormalizeClassCode(request.Code);
            var codeConflict = await _dbContext.Classes
                .AnyAsync(
                    @class => @class.Id != classId && @class.Code == normalizedCode,
                    cancellationToken);

            if (codeConflict)
            {
                throw new ConflictException("Class code is already in use.");
            }

            if (!Enum.TryParse<ClassStatus>(request.Status, ignoreCase: true, out var parsedStatus))
            {
                throw new ValidationException(
                    "Class status is invalid.",
                    new Dictionary<string, string[]>
                    {
                        [nameof(request.Status)] = new[] { "Class status must be Active or Archived." }
                    });
            }

            entity.Name = request.Name.Trim();
            entity.Code = normalizedCode;
            entity.Status = parsedStatus;

            await _dbContext.SaveChangesAsync(cancellationToken);

            var activeStudentCount = await _dbContext.ClassMemberships.CountAsync(
                membership => membership.ClassId == entity.Id && membership.Status == ClassMembershipStatus.Active,
                cancellationToken);

            var pendingInviteCount = await _dbContext.ClassInvites.CountAsync(
                invite => invite.ClassId == entity.Id && invite.Status == ClassInviteStatus.Pending && invite.ExpiresAtUtc > DateTime.UtcNow,
                cancellationToken);

            return MapSummary(entity, activeStudentCount, pendingInviteCount);
        }

        public async Task DeleteClassAsync(
            string teacherUserId,
            Guid classId,
            CancellationToken cancellationToken = default)
        {
            var entity = await _dbContext.Classes
                .FirstOrDefaultAsync(
                    @class => @class.Id == classId && @class.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (entity is null)
            {
                throw new NotFoundException("Class not found.");
            }

            _dbContext.Classes.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        private async Task EnsureTeacherExistsAsync(
            string teacherUserId,
            CancellationToken cancellationToken)
        {
            var exists = await _dbContext.TeacherProfiles
                .AnyAsync(profile => profile.UserId == teacherUserId, cancellationToken);

            if (!exists)
            {
                throw new ForbiddenException("Only teacher accounts can manage classes.");
            }
        }

        private async Task<Classroom> LoadOwnedClassAsync(
            string teacherUserId,
            Guid classId,
            CancellationToken cancellationToken)
        {
            var entity = await _dbContext.Classes
                .Include(@class => @class.Memberships)
                    .ThenInclude(membership => membership.StudentUser)
                        .ThenInclude(user => user.StudentProfile)
                .Include(@class => @class.Invites)
                .Include(@class => @class.ImportBatches)
                    .ThenInclude(batch => batch.Items)
                .FirstOrDefaultAsync(
                    @class => @class.Id == classId && @class.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (entity is null)
            {
                throw new NotFoundException("Class not found.");
            }

            return entity;
        }

        private async Task<string> EnsureUniqueClassCodeAsync(
            string initialCode,
            CancellationToken cancellationToken)
        {
            var candidate = NormalizeClassCode(initialCode);

            while (await _dbContext.Classes.AnyAsync(@class => @class.Code == candidate, cancellationToken))
            {
                candidate = AcademicCodeFactory.GenerateClassCode(candidate);
            }

            return candidate;
        }

        private static string NormalizeClassCode(string code)
        {
            return code.Trim().ToUpperInvariant().Replace(" ", string.Empty);
        }

        private static TeacherClassSummaryDto MapSummary(
            Classroom entity,
            int activeStudentCount,
            int pendingInviteCount)
        {
            return new TeacherClassSummaryDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Code = entity.Code,
                Status = entity.Status.ToString(),
                CreatedAtUtc = entity.CreatedAtUtc,
                ActiveStudentCount = activeStudentCount,
                PendingInviteCount = pendingInviteCount
            };
        }
    }
}
