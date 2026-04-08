using examxy.Application.Abstractions.Classrooms;
using examxy.Application.Abstractions.Classrooms.DTOs;
using examxy.Application.Abstractions.Email;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Application.Exceptions;
using examxy.Infrastructure.Academic;
using examxy.Infrastructure.Email;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace examxy.Infrastructure.Identity.Services
{
    public sealed class StudentOnboardingService : IStudentOnboardingService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleAssignmentService _roleAssignmentService;
        private readonly AuthResponseFactory _authResponseFactory;
        private readonly IEmailSender _emailSender;
        private readonly AppDbContext _dbContext;
        private readonly AppUrlOptions _appUrlOptions;

        public StudentOnboardingService(
            UserManager<ApplicationUser> userManager,
            RoleAssignmentService roleAssignmentService,
            AuthResponseFactory authResponseFactory,
            IEmailSender emailSender,
            AppDbContext dbContext,
            IOptions<AppUrlOptions> appUrlOptions)
        {
            _userManager = userManager;
            _roleAssignmentService = roleAssignmentService;
            _authResponseFactory = authResponseFactory;
            _emailSender = emailSender;
            _dbContext = dbContext;
            _appUrlOptions = appUrlOptions.Value;
        }

        public async Task<AuthResponseDto> RegisterStudentAsync(
            StudentRegisterRequestDto request,
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

            var trimmedStudentCode = request.StudentCode.Trim();
            if (!string.IsNullOrWhiteSpace(trimmedStudentCode))
            {
                var duplicateStudentCode = await _dbContext.StudentProfiles
                    .AnyAsync(
                        profile => profile.StudentCode == trimmedStudentCode,
                        cancellationToken);

                if (duplicateStudentCode)
                {
                    throw new ConflictException("Student code is already registered.");
                }
            }

            var user = new ApplicationUser
            {
                UserName = request.UserName.Trim(),
                Email = request.Email.Trim(),
                EmailConfirmed = false,
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

            await _roleAssignmentService.SetSingleRoleAsync(user, IdentityRoles.Student);

            _dbContext.StudentProfiles.Add(new StudentProfile
            {
                UserId = user.Id,
                StudentCode = string.IsNullOrWhiteSpace(trimmedStudentCode) ? null : trimmedStudentCode,
                OnboardingState = StudentOnboardingState.Active,
                CreatedAtUtc = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync(cancellationToken);

            try
            {
                await SendEmailConfirmationAsync(user, cancellationToken);
            }
            catch
            {
                await _userManager.DeleteAsync(user);
                throw;
            }

            return await _authResponseFactory.CreateAsync(user, cancellationToken);
        }

        public async Task<StudentDashboardDto> GetDashboardAsync(
            string studentUserId,
            CancellationToken cancellationToken = default)
        {
            var user = await _dbContext.Users
                .Include(candidate => candidate.StudentProfile)
                .Include(candidate => candidate.ClassMemberships)
                    .ThenInclude(membership => membership.Class)
                .FirstOrDefaultAsync(candidate => candidate.Id == studentUserId, cancellationToken);

            if (user is null)
            {
                throw new NotFoundException("User not found.");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = IdentityRoles.GetPrimaryRole(roles);
            if (!string.Equals(primaryRole, IdentityRoles.Student, StringComparison.OrdinalIgnoreCase))
            {
                throw new ForbiddenException("Only student accounts can access the student dashboard.");
            }

            var now = DateTime.UtcNow;
            var pendingInvites = await _dbContext.ClassInvites
                .Include(invite => invite.Class)
                .Where(invite =>
                    invite.NormalizedEmail == AcademicCodeFactory.NormalizeEmail(user.Email ?? string.Empty) &&
                    invite.Status == ClassInviteStatus.Pending &&
                    invite.ExpiresAtUtc > now)
                .OrderBy(invite => invite.ExpiresAtUtc)
                .ToListAsync(cancellationToken);

            return new StudentDashboardDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                StudentCode = user.StudentProfile?.StudentCode ?? string.Empty,
                OnboardingState = (user.StudentProfile?.OnboardingState ?? StudentOnboardingState.Active).ToString(),
                Classes = user.ClassMemberships
                    .OrderByDescending(membership => membership.JoinedAtUtc)
                    .Select(membership => new StudentDashboardClassDto
                    {
                        Id = membership.ClassId,
                        Name = membership.Class.Name,
                        Code = membership.Class.Code,
                        Status = membership.Class.Status.ToString(),
                        MembershipStatus = membership.Status.ToString(),
                        JoinedAtUtc = membership.JoinedAtUtc
                    })
                    .ToArray(),
                PendingInvites = pendingInvites
                    .Select(invite => new StudentPendingInviteDto
                    {
                        Id = invite.Id,
                        ClassId = invite.ClassId,
                        ClassName = invite.Class.Name,
                        ClassCode = invite.Class.Code,
                        Status = invite.Status.ToString(),
                        ExpiresAtUtc = invite.ExpiresAtUtc,
                        SentAtUtc = invite.SentAtUtc
                    })
                    .ToArray()
            };
        }

        private async Task SendEmailConfirmationAsync(
            ApplicationUser user,
            CancellationToken cancellationToken)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = EmailTokenCodec.Encode(token);
            var confirmationUrl = QueryHelpers.AddQueryString(
                BuildFrontendUrl(_appUrlOptions.ConfirmEmailPath),
                new Dictionary<string, string?>
                {
                    ["userId"] = user.Id,
                    ["token"] = encodedToken
                });

            await _emailSender.SendAsync(
                AuthEmailTemplateFactory.CreateEmailConfirmationMessage(
                    user.Email ?? string.Empty,
                    "Examxy",
                    confirmationUrl),
                cancellationToken);
        }

        private string BuildFrontendUrl(string path)
        {
            return new Uri(new Uri(_appUrlOptions.FrontendBaseUrl), path).ToString();
        }
    }
}
