using examxy.Application.Abstractions.Email;
using examxy.Application.Exceptions;
using examxy.Application.Features.Classrooms;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Email;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace examxy.Infrastructure.Features.Classrooms
{
    public sealed class TeacherClassService : ITeacherClassService
    {
        private readonly AppDbContext _dbContext;
        private readonly IEmailSender _emailSender;
        private readonly AppUrlOptions _appUrlOptions;

        public TeacherClassService(
            AppDbContext dbContext,
            IEmailSender emailSender,
            IOptions<AppUrlOptions> appUrlOptions)
        {
            _dbContext = dbContext;
            _emailSender = emailSender;
            _appUrlOptions = appUrlOptions.Value;
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
                Subject = request.Subject?.Trim() ?? string.Empty,
                Grade = request.Grade?.Trim() ?? string.Empty,
                Term = request.Term?.Trim() ?? string.Empty,
                JoinMode = ParseJoinMode(request.JoinMode),
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
                    Subject = @class.Subject,
                    Grade = @class.Grade,
                    Term = @class.Term,
                    JoinMode = @class.JoinMode.ToString(),
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
            var membershipStudentIds = entity.Memberships
                .Select(membership => membership.StudentUserId)
                .Distinct()
                .ToArray();

            var membershipStudents = await _dbContext.Users
                .Include(user => user.StudentProfile)
                .Where(user => membershipStudentIds.Contains(user.Id))
                .ToDictionaryAsync(user => user.Id, cancellationToken);

            return new TeacherClassDetailDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Code = entity.Code,
                Subject = entity.Subject,
                Grade = entity.Grade,
                Term = entity.Term,
                JoinMode = entity.JoinMode.ToString(),
                Status = entity.Status.ToString(),
                CreatedAtUtc = entity.CreatedAtUtc,
                Memberships = entity.Memberships
                    .OrderByDescending(membership => membership.JoinedAtUtc)
                    .Select(membership =>
                    {
                        var hasUser = membershipStudents.TryGetValue(
                            membership.StudentUserId,
                            out var studentUser);

                        return new ClassMembershipDto
                        {
                            Id = membership.Id,
                            StudentUserId = membership.StudentUserId,
                            StudentUserName = hasUser ? studentUser!.UserName ?? string.Empty : string.Empty,
                            StudentFullName = hasUser ? studentUser!.FullName : string.Empty,
                            Email = hasUser ? studentUser!.Email ?? string.Empty : string.Empty,
                            StudentCode = hasUser ? studentUser!.StudentProfile?.StudentCode ?? string.Empty : string.Empty,
                            Status = membership.Status.ToString(),
                            JoinedAtUtc = membership.JoinedAtUtc
                        };
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

        public async Task DeleteMembershipAsync(
            string teacherUserId,
            Guid classId,
            Guid membershipId,
            CancellationToken cancellationToken = default)
        {
            var membership = await _dbContext.ClassMemberships
                .Include(candidate => candidate.Class)
                .FirstOrDefaultAsync(
                    candidate =>
                        candidate.Id == membershipId &&
                        candidate.ClassId == classId &&
                        candidate.Class.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (membership is null)
            {
                throw new NotFoundException("Class membership not found.");
            }

            _dbContext.ClassMemberships.Remove(membership);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task<ClassInviteDto> ResendInviteAsync(
            string teacherUserId,
            Guid classId,
            Guid inviteId,
            CancellationToken cancellationToken = default)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == classId && candidate.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (classroom is null)
            {
                throw new NotFoundException("Class not found.");
            }

            var invite = await _dbContext.ClassInvites
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == inviteId && candidate.ClassId == classId,
                    cancellationToken);

            if (invite is null)
            {
                throw new NotFoundException("Class invite not found.");
            }

            if (invite.Status is ClassInviteStatus.Used or ClassInviteStatus.Cancelled)
            {
                throw new ConflictException("This invite cannot be resent.");
            }

            var stalePendingInvites = await _dbContext.ClassInvites
                .Where(candidate =>
                    candidate.ClassId == classId &&
                    candidate.NormalizedEmail == invite.NormalizedEmail &&
                    candidate.Status == ClassInviteStatus.Pending)
                .ToListAsync(cancellationToken);

            foreach (var staleInvite in stalePendingInvites)
            {
                staleInvite.Status = ClassInviteStatus.Cancelled;
            }

            var rawInviteCode = AcademicCodeFactory.GenerateInviteCode();
            var resentInvite = new ClassInvite
            {
                Id = Guid.NewGuid(),
                ClassId = classId,
                Email = invite.Email,
                NormalizedEmail = invite.NormalizedEmail,
                StudentUserId = invite.StudentUserId,
                InviteCodeHash = AcademicCodeFactory.HashValue(rawInviteCode),
                Status = ClassInviteStatus.Pending,
                CreatedAtUtc = DateTime.UtcNow,
                SentAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(14)
            };

            _dbContext.ClassInvites.Add(resentInvite);
            await _dbContext.SaveChangesAsync(cancellationToken);

            var joinUrl = QueryHelpers.AddQueryString(
                BuildFrontendUrl(_appUrlOptions.StudentDashboardPath),
                new Dictionary<string, string?>
                {
                    ["inviteCode"] = rawInviteCode
                });

            var emailMessage = AuthEmailTemplateFactory.CreateStudentClassInviteMessage(
                resentInvite.Email,
                "Examxy",
                classroom.Name,
                rawInviteCode,
                joinUrl);

            await _emailSender.SendAsync(emailMessage, cancellationToken);

            return new ClassInviteDto
            {
                Id = resentInvite.Id,
                Email = resentInvite.Email,
                Status = resentInvite.Status.ToString(),
                SentAtUtc = resentInvite.SentAtUtc,
                ExpiresAtUtc = resentInvite.ExpiresAtUtc,
                UsedAtUtc = resentInvite.UsedAtUtc,
                StudentUserId = resentInvite.StudentUserId ?? string.Empty,
                UsedByUserId = resentInvite.UsedByUserId ?? string.Empty
            };
        }

        public async Task<ClassInviteDto> CancelInviteAsync(
            string teacherUserId,
            Guid classId,
            Guid inviteId,
            CancellationToken cancellationToken = default)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == classId && candidate.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (classroom is null)
            {
                throw new NotFoundException("Class not found.");
            }

            var invite = await _dbContext.ClassInvites
                .FirstOrDefaultAsync(
                    candidate => candidate.Id == inviteId && candidate.ClassId == classId,
                    cancellationToken);

            if (invite is null)
            {
                throw new NotFoundException("Class invite not found.");
            }

            if (invite.Status is ClassInviteStatus.Used or ClassInviteStatus.Cancelled)
            {
                throw new ConflictException("This invite cannot be cancelled.");
            }

            invite.Status = ClassInviteStatus.Cancelled;
            await _dbContext.SaveChangesAsync(cancellationToken);

            return new ClassInviteDto
            {
                Id = invite.Id,
                Email = invite.Email,
                Status = invite.Status.ToString(),
                SentAtUtc = invite.SentAtUtc,
                ExpiresAtUtc = invite.ExpiresAtUtc,
                UsedAtUtc = invite.UsedAtUtc,
                StudentUserId = invite.StudentUserId ?? string.Empty,
                UsedByUserId = invite.UsedByUserId ?? string.Empty
            };
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

        private string BuildFrontendUrl(string path)
        {
            return new Uri(new Uri(_appUrlOptions.FrontendBaseUrl), path).ToString();
        }

        private static string NormalizeClassCode(string code)
        {
            return code.Trim().ToUpperInvariant().Replace(" ", string.Empty);
        }

        private static ClassJoinMode ParseJoinMode(string? joinMode)
        {
            if (string.IsNullOrWhiteSpace(joinMode))
            {
                return ClassJoinMode.InviteOnly;
            }

            if (Enum.TryParse<ClassJoinMode>(joinMode, ignoreCase: true, out var parsed))
            {
                return parsed;
            }

            throw new ValidationException(
                "Class join mode is invalid.",
                new Dictionary<string, string[]>
                {
                    [nameof(CreateTeacherClassRequestDto.JoinMode)] =
                        new[] { "Join mode must be InviteOnly or CodeJoin." }
                });
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
                Subject = entity.Subject,
                Grade = entity.Grade,
                Term = entity.Term,
                JoinMode = entity.JoinMode.ToString(),
                Status = entity.Status.ToString(),
                CreatedAtUtc = entity.CreatedAtUtc,
                ActiveStudentCount = activeStudentCount,
                PendingInviteCount = pendingInviteCount
            };
        }
    }
}
