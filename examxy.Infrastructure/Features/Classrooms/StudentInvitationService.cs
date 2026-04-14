using examxy.Application.Features.Classrooms;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Infrastructure.Identity;
using examxy.Infrastructure.Persistence;
using examxy.Domain.Classrooms;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Features.Classrooms
{
    public sealed class StudentInvitationService : IStudentInvitationService
    {
        private readonly AppDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;

        public StudentInvitationService(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager)
        {
            _dbContext = dbContext;
            _userManager = userManager;
        }

        public async Task<ClaimClassInviteResultDto> ClaimInviteAsync(
            string studentUserId,
            ClaimClassInviteRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var user = await _dbContext.Users
                .Include(candidate => candidate.StudentProfile)
                .FirstOrDefaultAsync(candidate => candidate.Id == studentUserId, cancellationToken);

            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = IdentityRoles.GetPrimaryRole(roles);
            if (!string.Equals(primaryRole, IdentityRoles.Student, StringComparison.OrdinalIgnoreCase))
            {
                throw new ForbiddenException("Only student accounts can claim class invites.");
            }

            var inviteCodeHash = AcademicCodeFactory.HashValue(
                request.InviteCode.Trim().ToUpperInvariant());

            var invite = await _dbContext.ClassInvites
                .Include(candidate => candidate.Class)
                .FirstOrDefaultAsync(candidate => candidate.InviteCodeHash == inviteCodeHash, cancellationToken);

            if (invite is null || invite.Status is ClassInviteStatus.Cancelled or ClassInviteStatus.Rejected)
            {
                throw new RuleViolationException(
                    "Invite code is invalid.",
                    "class_invite_invalid",
                    404);
            }

            if (invite.Status == ClassInviteStatus.Used)
            {
                throw new RuleViolationException(
                    "Invite code has already been used.",
                    "class_invite_used");
            }

            if (invite.Status == ClassInviteStatus.Expired || invite.ExpiresAtUtc <= DateTime.UtcNow)
            {
                if (invite.Status == ClassInviteStatus.Pending)
                {
                    invite.Status = ClassInviteStatus.Expired;
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }

                throw new RuleViolationException(
                    "Invite code has expired.",
                    "class_invite_expired");
            }

            var normalizedEmail = AcademicCodeFactory.NormalizeEmail(user.Email ?? string.Empty);
            if (!string.Equals(invite.NormalizedEmail, normalizedEmail, StringComparison.Ordinal))
            {
                throw new RuleViolationException(
                    "This invite was issued for a different email address.",
                    "class_invite_email_mismatch",
                    403);
            }

            var membership = await _dbContext.ClassMemberships
                .FirstOrDefaultAsync(
                    candidate => candidate.ClassId == invite.ClassId && candidate.StudentUserId == studentUserId,
                    cancellationToken);

            var joinedAtUtc = DateTime.UtcNow;
            if (membership is null)
            {
                membership = new ClassMembership
                {
                    Id = Guid.NewGuid(),
                    ClassId = invite.ClassId,
                    StudentUserId = studentUserId,
                    Status = ClassMembershipStatus.Active,
                    JoinedAtUtc = joinedAtUtc
                };

                _dbContext.ClassMemberships.Add(membership);
            }
            else
            {
                membership.Status = ClassMembershipStatus.Active;
                membership.JoinedAtUtc ??= joinedAtUtc;
                joinedAtUtc = membership.JoinedAtUtc.Value;
            }

            invite.Status = ClassInviteStatus.Used;
            invite.StudentUserId = studentUserId;
            invite.UsedByUserId = studentUserId;
            invite.UsedAtUtc = joinedAtUtc;

            if (user.StudentProfile is null)
            {
                _dbContext.StudentProfiles.Add(new StudentProfile
                {
                    UserId = user.Id,
                    OnboardingState = StudentOnboardingState.Active,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else if (user.StudentProfile.OnboardingState == StudentOnboardingState.Invited)
            {
                user.StudentProfile.OnboardingState = StudentOnboardingState.Active;
            }

            user.LastActivatedAtUtc = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return new ClaimClassInviteResultDto
            {
                ClassId = invite.ClassId,
                ClassName = invite.Class.Name,
                ClassCode = invite.Class.Code,
                MembershipStatus = membership.Status.ToString(),
                JoinedAtUtc = joinedAtUtc
            };
        }
    }
}
