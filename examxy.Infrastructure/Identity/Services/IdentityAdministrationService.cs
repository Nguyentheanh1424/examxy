using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Identity.Services
{
    public sealed class IdentityAdministrationService : IIdentityAdministrationService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly RoleAssignmentService _roleAssignmentService;
        private readonly AppDbContext _dbContext;

        public IdentityAdministrationService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            RoleAssignmentService roleAssignmentService,
            AppDbContext dbContext)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _roleAssignmentService = roleAssignmentService;
            _dbContext = dbContext;
        }

        public async Task<ProvisionedUserDto> ProvisionAdminAsync(
            ProvisionAdminUserRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var existingUserByUserName = await _userManager.FindByNameAsync(request.UserName);
            if (existingUserByUserName is not null)
            {
                throw new ConflictException("Username is already taken.");
            }

            var existingUserByEmail = await _userManager.FindByEmailAsync(request.Email);
            if (existingUserByEmail is not null)
            {
                throw new ConflictException("Email is already registered.");
            }

            var user = new ApplicationUser
            {
                UserName = request.UserName.Trim(),
                Email = request.Email.Trim(),
                EmailConfirmed = true,
                FullName = string.IsNullOrWhiteSpace(request.FullName)
                    ? request.UserName.Trim()
                    : request.FullName.Trim(),
                CreatedAtUtc = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(createResult.Errors);
            }

            await _roleAssignmentService.SetSingleRoleAsync(user, IdentityRoles.Admin);

            var roles = await _userManager.GetRolesAsync(user);

            return new ProvisionedUserDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                PrimaryRole = IdentityRoles.GetPrimaryRole(roles),
                Roles = roles.ToArray()
            };
        }

        public async Task<IdentityAuditReportDto> AuditIdentityIntegrityAsync(
            CancellationToken cancellationToken = default)
        {
            var issues = new List<IdentityAuditIssueDto>();
            var users = await _userManager.Users.ToListAsync(cancellationToken);

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var roleSnapshot = roles.ToArray();
                var primaryRole = IdentityRoles.GetPrimaryRole(roles);

                if (string.IsNullOrWhiteSpace(primaryRole))
                {
                    issues.Add(CreateIssue("missing_primary_role", user, roleSnapshot, "User does not have a supported primary role."));
                }

                if (roles.Contains(IdentityRoles.Teacher, StringComparer.OrdinalIgnoreCase) &&
                    !await _dbContext.TeacherProfiles.AnyAsync(profile => profile.UserId == user.Id, cancellationToken))
                {
                    issues.Add(CreateIssue("missing_teacher_profile", user, roleSnapshot, "Teacher account is missing TeacherProfile."));
                }

                if (roles.Contains(IdentityRoles.Student, StringComparer.OrdinalIgnoreCase) &&
                    !await _dbContext.StudentProfiles.AnyAsync(profile => profile.UserId == user.Id, cancellationToken))
                {
                    issues.Add(CreateIssue("missing_student_profile", user, roleSnapshot, "Student account is missing StudentProfile."));
                }
            }

            if (await _roleManager.RoleExistsAsync(IdentityRoles.LegacyUser))
            {
                var legacyUsers = await _userManager.GetUsersInRoleAsync(IdentityRoles.LegacyUser);
                foreach (var user in legacyUsers)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    issues.Add(CreateIssue("legacy_role_assignment", user, roles.ToArray(), "User still has the legacy User role assignment."));
                }
            }

            return new IdentityAuditReportDto
            {
                UsersScanned = users.Count,
                MissingPrimaryRoleCount = issues.Count(issue => issue.IssueType == "missing_primary_role"),
                MissingTeacherProfileCount = issues.Count(issue => issue.IssueType == "missing_teacher_profile"),
                MissingStudentProfileCount = issues.Count(issue => issue.IssueType == "missing_student_profile"),
                LegacyAssignmentCount = issues.Count(issue => issue.IssueType == "legacy_role_assignment"),
                Issues = issues
            };
        }

        public async Task<IdentityMaintenanceResultDto> RepairMissingPrimaryRolesAsync(
            CancellationToken cancellationToken = default)
        {
            var users = await _userManager.Users.ToListAsync(cancellationToken);
            var changedCount = 0;

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (!string.IsNullOrWhiteSpace(IdentityRoles.GetPrimaryRole(roles)))
                {
                    continue;
                }

                await _roleAssignmentService.SetSingleRoleAsync(user, IdentityRoles.Teacher);
                changedCount++;
            }

            return new IdentityMaintenanceResultDto
            {
                Operation = "repair_primary_roles",
                ScannedCount = users.Count,
                ChangedCount = changedCount
            };
        }

        public async Task<IdentityMaintenanceResultDto> BackfillMissingProfilesAsync(
            CancellationToken cancellationToken = default)
        {
            var users = await _userManager.Users.ToListAsync(cancellationToken);
            var changedCount = 0;

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                if (roles.Contains(IdentityRoles.Teacher, StringComparer.OrdinalIgnoreCase) &&
                    !await _dbContext.TeacherProfiles.AnyAsync(profile => profile.UserId == user.Id, cancellationToken))
                {
                    _dbContext.TeacherProfiles.Add(new TeacherProfile
                    {
                        UserId = user.Id,
                        CreatedAtUtc = user.CreatedAtUtc == default ? DateTime.UtcNow : user.CreatedAtUtc
                    });
                    changedCount++;
                }

                if (roles.Contains(IdentityRoles.Student, StringComparer.OrdinalIgnoreCase) &&
                    !await _dbContext.StudentProfiles.AnyAsync(profile => profile.UserId == user.Id, cancellationToken))
                {
                    _dbContext.StudentProfiles.Add(new StudentProfile
                    {
                        UserId = user.Id,
                        OnboardingState = StudentOnboardingState.Active,
                        CreatedAtUtc = user.CreatedAtUtc == default ? DateTime.UtcNow : user.CreatedAtUtc
                    });
                    changedCount++;
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return new IdentityMaintenanceResultDto
            {
                Operation = "backfill_profiles",
                ScannedCount = users.Count,
                ChangedCount = changedCount
            };
        }

        public async Task<IdentityMaintenanceResultDto> MigrateLegacyUsersAsync(
            CancellationToken cancellationToken = default)
        {
            if (!await _roleManager.RoleExistsAsync(IdentityRoles.LegacyUser))
            {
                return new IdentityMaintenanceResultDto
                {
                    Operation = "migrate_legacy_users",
                    Warnings = new[] { "Legacy role does not exist." }
                };
            }

            var legacyUsers = await _userManager.GetUsersInRoleAsync(IdentityRoles.LegacyUser);
            foreach (var user in legacyUsers)
            {
                await _roleAssignmentService.SetSingleRoleAsync(user, IdentityRoles.Teacher);
            }

            var legacyRole = await _roleManager.FindByNameAsync(IdentityRoles.LegacyUser);
            if (legacyRole is not null)
            {
                var hasAssignments = await _dbContext.UserRoles
                    .AnyAsync(userRole => userRole.RoleId == legacyRole.Id, cancellationToken);

                if (!hasAssignments)
                {
                    await _roleManager.DeleteAsync(legacyRole);
                }
            }

            return new IdentityMaintenanceResultDto
            {
                Operation = "migrate_legacy_users",
                ScannedCount = legacyUsers.Count,
                ChangedCount = legacyUsers.Count
            };
        }

        private static IdentityAuditIssueDto CreateIssue(
            string issueType,
            ApplicationUser user,
            IReadOnlyCollection<string> roles,
            string details)
        {
            return new IdentityAuditIssueDto
            {
                IssueType = issueType,
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                Roles = roles.ToArray(),
                Details = details
            };
        }
    }
}
