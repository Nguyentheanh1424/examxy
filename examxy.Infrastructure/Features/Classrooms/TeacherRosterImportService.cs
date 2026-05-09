using examxy.Application.Abstractions.Email;
using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.Classrooms;
using examxy.Application.Features.Classrooms.DTOs;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Email;
using examxy.Infrastructure.Identity;
using examxy.Infrastructure.Identity.Services;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace examxy.Infrastructure.Features.Classrooms
{
    public sealed class TeacherRosterImportService : ITeacherRosterImportService
    {
        private readonly AppDbContext _dbContext;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleAssignmentService _roleAssignmentService;
        private readonly IEmailSender _emailSender;
        private readonly AppUrlOptions _appUrlOptions;

        public TeacherRosterImportService(
            AppDbContext dbContext,
            UserManager<ApplicationUser> userManager,
            RoleAssignmentService roleAssignmentService,
            IEmailSender emailSender,
            IOptions<AppUrlOptions> appUrlOptions)
        {
            _dbContext = dbContext;
            _userManager = userManager;
            _roleAssignmentService = roleAssignmentService;
            _emailSender = emailSender;
            _appUrlOptions = appUrlOptions.Value;
        }

        public async Task<StudentImportBatchDto> ImportStudentsAsync(
            string teacherUserId,
            Guid classId,
            ImportStudentRosterRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(
                    @class => @class.Id == classId && @class.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (classroom is null)
            {
                throw new NotFoundException("Class not found.");
            }

            var batch = new StudentImportBatch
            {
                Id = Guid.NewGuid(),
                ClassId = classId,
                TeacherUserId = teacherUserId,
                SourceFileName = request.SourceFileName.Trim(),
                CreatedAtUtc = DateTime.UtcNow,
                TotalRows = request.Students.Count
            };

            var outgoingEmails = new List<EmailMessage>();
            var seenEmails = new HashSet<string>(StringComparer.Ordinal);
            var seenStudentCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            _dbContext.StudentImportBatches.Add(batch);

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            var rowNumber = 0;
            foreach (var row in request.Students)
            {
                rowNumber++;

                var trimmedEmail = row.Email.Trim();
                var normalizedEmail = AcademicCodeFactory.NormalizeEmail(trimmedEmail);
                var trimmedStudentCode = row.StudentCode.Trim();
                var trimmedFullName = row.FullName.Trim();

                if (!seenEmails.Add(normalizedEmail))
                {
                    AddItem(
                        batch,
                        rowNumber,
                        trimmedFullName,
                        trimmedStudentCode,
                        trimmedEmail,
                        StudentImportItemResultType.RejectedDuplicate,
                        "This email appears more than once in the same import.");
                    batch.RejectedCount++;
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(trimmedStudentCode) &&
                    !seenStudentCodes.Add(trimmedStudentCode))
                {
                    AddItem(
                        batch,
                        rowNumber,
                        trimmedFullName,
                        trimmedStudentCode,
                        trimmedEmail,
                        StudentImportItemResultType.RejectedDuplicate,
                        "This student code appears more than once in the same import.");
                    batch.RejectedCount++;
                    continue;
                }

                var existingUser = await _dbContext.Users
                    .Include(user => user.StudentProfile)
                    .FirstOrDefaultAsync(
                        user => user.NormalizedEmail == normalizedEmail,
                        cancellationToken);

                if (!string.IsNullOrWhiteSpace(trimmedStudentCode))
                {
                    var duplicateStudentCodeOwner = await _dbContext.StudentProfiles
                        .Where(profile => profile.StudentCode == trimmedStudentCode)
                        .Select(profile => profile.UserId)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (!string.IsNullOrWhiteSpace(duplicateStudentCodeOwner) &&
                        !string.Equals(duplicateStudentCodeOwner, existingUser?.Id, StringComparison.Ordinal))
                    {
                        AddItem(
                            batch,
                            rowNumber,
                            trimmedFullName,
                            trimmedStudentCode,
                            trimmedEmail,
                            StudentImportItemResultType.RejectedDuplicate,
                            "This student code is already assigned to another account.");
                        batch.RejectedCount++;
                        continue;
                    }
                }

                if (existingUser is null)
                {
                    var createdUser = await CreateInvitedStudentAsync(
                        trimmedEmail,
                        trimmedFullName,
                        trimmedStudentCode,
                        cancellationToken);

                    var invite = await CreateInviteAsync(
                        classroom,
                        trimmedEmail,
                        createdUser.Id,
                        cancellationToken);

                    outgoingEmails.Add(
                        await CreateActivationInviteEmailAsync(
                            createdUser,
                            classroom,
                            invite.RawInviteCode,
                            cancellationToken));

                    AddItem(
                        batch,
                        rowNumber,
                        createdUser.FullName,
                        trimmedStudentCode,
                        trimmedEmail,
                        StudentImportItemResultType.CreatedAccount,
                        "Created a student account and sent an activation email.",
                        createdUser.Id,
                        invite.Entity.Id);

                    batch.CreatedAccountCount++;
                    continue;
                }

                var existingRoles = await _userManager.GetRolesAsync(existingUser);
                var primaryRole = IdentityRoles.GetPrimaryRole(existingRoles);
                if (!string.Equals(primaryRole, IdentityRoles.Student, StringComparison.OrdinalIgnoreCase))
                {
                    AddItem(
                        batch,
                        rowNumber,
                        trimmedFullName,
                        trimmedStudentCode,
                        trimmedEmail,
                        StudentImportItemResultType.RejectedWrongRole,
                        $"This email already belongs to a {primaryRole} account.");
                    batch.RejectedCount++;
                    continue;
                }

                var existingMembership = await _dbContext.ClassMemberships
                    .FirstOrDefaultAsync(
                        membership =>
                            membership.ClassId == classId &&
                            membership.StudentUserId == existingUser.Id &&
                            membership.Status == ClassMembershipStatus.Active,
                        cancellationToken);

                if (existingMembership is not null)
                {
                    AddItem(
                        batch,
                        rowNumber,
                        string.IsNullOrWhiteSpace(trimmedFullName) ? existingUser.FullName : trimmedFullName,
                        trimmedStudentCode,
                        trimmedEmail,
                        StudentImportItemResultType.SkippedExisting,
                        "This student is already active in the class.",
                        existingUser.Id);
                    batch.SkippedCount++;
                    continue;
                }

                if (string.IsNullOrWhiteSpace(existingUser.FullName) && !string.IsNullOrWhiteSpace(trimmedFullName))
                {
                    existingUser.FullName = trimmedFullName;
                }

                if (existingUser.StudentProfile is null)
                {
                    existingUser.StudentProfile = new StudentProfile
                    {
                        UserId = existingUser.Id,
                        StudentCode = string.IsNullOrWhiteSpace(trimmedStudentCode) ? null : trimmedStudentCode,
                        OnboardingState = StudentOnboardingState.Active,
                        CreatedAtUtc = DateTime.UtcNow
                    };
                }
                else if (string.IsNullOrWhiteSpace(existingUser.StudentProfile.StudentCode) &&
                         !string.IsNullOrWhiteSpace(trimmedStudentCode))
                {
                    existingUser.StudentProfile.StudentCode = trimmedStudentCode;
                }

                var resentInvite = await CreateInviteAsync(
                    classroom,
                    trimmedEmail,
                    existingUser.Id,
                    cancellationToken);

                var needsActivationEmail = existingUser.StudentProfile?.OnboardingState == StudentOnboardingState.Invited;
                if (needsActivationEmail)
                {
                    outgoingEmails.Add(
                        await CreateActivationInviteEmailAsync(
                            existingUser,
                            classroom,
                            resentInvite.RawInviteCode,
                            cancellationToken));
                }
                else
                {
                    outgoingEmails.Add(
                        CreateClassInviteEmail(
                            trimmedEmail,
                            classroom,
                            resentInvite.RawInviteCode));
                }

                AddItem(
                    batch,
                    rowNumber,
                    string.IsNullOrWhiteSpace(trimmedFullName) ? existingUser.FullName : trimmedFullName,
                    trimmedStudentCode,
                    trimmedEmail,
                    StudentImportItemResultType.SentInvite,
                    "Sent a class invite email to the existing student account.",
                    existingUser.Id,
                    resentInvite.Entity.Id);

                batch.SentInviteCount++;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            foreach (var email in outgoingEmails)
            {
                await _emailSender.SendAsync(email, cancellationToken);
            }

            return new StudentImportBatchDto
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
            };
        }

        public async Task<RosterImportPreviewDto> PreviewImportAsync(
            string teacherUserId,
            Guid classId,
            ImportStudentRosterRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var classroomExists = await _dbContext.Classes
                .AnyAsync(
                    @class => @class.Id == classId && @class.OwnerTeacherUserId == teacherUserId,
                    cancellationToken);

            if (!classroomExists)
            {
                throw new NotFoundException("Class not found.");
            }

            var items = new List<RosterImportPreviewItemDto>();
            var seenEmails = new HashSet<string>(StringComparer.Ordinal);
            var seenStudentCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var rowNumber = 0;
            foreach (var row in request.Students)
            {
                rowNumber++;

                var trimmedEmail = row.Email.Trim();
                var normalizedEmail = AcademicCodeFactory.NormalizeEmail(trimmedEmail);
                var trimmedStudentCode = row.StudentCode.Trim();
                var trimmedFullName = row.FullName.Trim();
                var warnings = new List<string>();
                var errors = new List<string>();
                var action = "CreateAccount";

                if (!seenEmails.Add(normalizedEmail))
                {
                    errors.Add("This email appears more than once in the same import.");
                    items.Add(CreatePreviewItem(rowNumber, trimmedFullName, trimmedStudentCode, trimmedEmail, "Error", "Reject", warnings, errors));
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(trimmedStudentCode) &&
                    !seenStudentCodes.Add(trimmedStudentCode))
                {
                    errors.Add("This student code appears more than once in the same import.");
                    items.Add(CreatePreviewItem(rowNumber, trimmedFullName, trimmedStudentCode, trimmedEmail, "Error", "Reject", warnings, errors));
                    continue;
                }

                var existingUser = await _dbContext.Users
                    .Include(user => user.StudentProfile)
                    .FirstOrDefaultAsync(
                        user => user.NormalizedEmail == normalizedEmail,
                        cancellationToken);

                if (!string.IsNullOrWhiteSpace(trimmedStudentCode))
                {
                    var duplicateStudentCodeOwner = await _dbContext.StudentProfiles
                        .Where(profile => profile.StudentCode == trimmedStudentCode)
                        .Select(profile => profile.UserId)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (!string.IsNullOrWhiteSpace(duplicateStudentCodeOwner) &&
                        !string.Equals(duplicateStudentCodeOwner, existingUser?.Id, StringComparison.Ordinal))
                    {
                        errors.Add("This student code is already assigned to another account.");
                        items.Add(CreatePreviewItem(rowNumber, trimmedFullName, trimmedStudentCode, trimmedEmail, "Error", "Reject", warnings, errors));
                        continue;
                    }
                }

                if (existingUser is not null)
                {
                    var existingRoles = await _userManager.GetRolesAsync(existingUser);
                    var primaryRole = IdentityRoles.GetPrimaryRole(existingRoles);
                    if (!string.Equals(primaryRole, IdentityRoles.Student, StringComparison.OrdinalIgnoreCase))
                    {
                        errors.Add($"This email already belongs to a {primaryRole} account.");
                        items.Add(CreatePreviewItem(rowNumber, trimmedFullName, trimmedStudentCode, trimmedEmail, "Error", "Reject", warnings, errors));
                        continue;
                    }

                    var existingMembership = await _dbContext.ClassMemberships
                        .FirstOrDefaultAsync(
                            membership =>
                                membership.ClassId == classId &&
                                membership.StudentUserId == existingUser.Id &&
                                membership.Status == ClassMembershipStatus.Active,
                            cancellationToken);

                    if (existingMembership is not null)
                    {
                        warnings.Add("This student is already active in the class.");
                        items.Add(CreatePreviewItem(
                            rowNumber,
                            string.IsNullOrWhiteSpace(trimmedFullName) ? existingUser.FullName : trimmedFullName,
                            trimmedStudentCode,
                            trimmedEmail,
                            "Warning",
                            "Skip",
                            warnings,
                            errors));
                        continue;
                    }

                    action = "SendInvite";

                    var hasPendingInvite = await _dbContext.ClassInvites.AnyAsync(
                        invite =>
                            invite.ClassId == classId &&
                            invite.NormalizedEmail == normalizedEmail &&
                            invite.Status == ClassInviteStatus.Pending,
                        cancellationToken);

                    if (hasPendingInvite)
                    {
                        warnings.Add("An existing pending invite will be replaced.");
                    }
                }

                items.Add(CreatePreviewItem(
                    rowNumber,
                    trimmedFullName,
                    trimmedStudentCode,
                    trimmedEmail,
                    warnings.Count > 0 ? "Warning" : "Ready",
                    action,
                    warnings,
                    errors));
            }

            return new RosterImportPreviewDto
            {
                ClassId = classId,
                SourceFileName = request.SourceFileName.Trim(),
                TotalRows = request.Students.Count,
                ReadyCount = items.Count(item => item.Status == "Ready"),
                WarningCount = items.Count(item => item.Status == "Warning"),
                ErrorCount = items.Count(item => item.Status == "Error"),
                Items = items
            };
        }

        public async Task<StudentImportItemDto> AddStudentByEmailAsync(
            string teacherUserId,
            Guid classId,
            AddStudentByEmailRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var importResult = await ImportStudentsAsync(
                teacherUserId,
                classId,
                new ImportStudentRosterRequestDto
                {
                    SourceFileName = "single-student-api",
                    Students = new[]
                    {
                        new StudentRosterItemInputDto
                        {
                            Email = request.Email
                        }
                    }
                },
                cancellationToken);

            var item = importResult.Items.Single();
            if (string.Equals(
                    item.ResultType,
                    StudentImportItemResultType.RejectedWrongRole.ToString(),
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new ConflictException(item.Message);
            }

            return item;
        }

        private async Task<ApplicationUser> CreateInvitedStudentAsync(
            string email,
            string fullName,
            string studentCode,
            CancellationToken cancellationToken)
        {
            var user = new ApplicationUser
            {
                UserName = await GenerateUniqueStudentUserNameAsync(email, studentCode),
                Email = email,
                EmailConfirmed = true,
                FullName = string.IsNullOrWhiteSpace(fullName) ? email.Split('@', 2)[0] : fullName,
                CreatedAtUtc = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(
                user,
                AcademicCodeFactory.GenerateTemporaryPassword());

            if (!createResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(createResult.Errors);
            }

            await _roleAssignmentService.SetSingleRoleAsync(user, IdentityRoles.Student);

            _dbContext.StudentProfiles.Add(new StudentProfile
            {
                UserId = user.Id,
                StudentCode = string.IsNullOrWhiteSpace(studentCode) ? null : studentCode,
                OnboardingState = StudentOnboardingState.Invited,
                CreatedAtUtc = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync(cancellationToken);
            _dbContext.Entry(user).State = EntityState.Detached;

            return user;
        }

        private async Task<(ClassInvite Entity, string RawInviteCode)> CreateInviteAsync(
            Classroom classroom,
            string email,
            string studentUserId,
            CancellationToken cancellationToken)
        {
            var normalizedEmail = AcademicCodeFactory.NormalizeEmail(email);

            var stalePendingInvites = await _dbContext.ClassInvites
                .Where(invite =>
                    invite.ClassId == classroom.Id &&
                    invite.NormalizedEmail == normalizedEmail &&
                    invite.Status == ClassInviteStatus.Pending)
                .ToListAsync(cancellationToken);

            foreach (var invite in stalePendingInvites)
            {
                invite.Status = ClassInviteStatus.Cancelled;
            }

            var rawInviteCode = AcademicCodeFactory.GenerateInviteCode();
            var classInvite = new ClassInvite
            {
                Id = Guid.NewGuid(),
                ClassId = classroom.Id,
                Email = email,
                NormalizedEmail = normalizedEmail,
                StudentUserId = studentUserId,
                InviteCodeHash = AcademicCodeFactory.HashValue(rawInviteCode),
                Status = ClassInviteStatus.Pending,
                CreatedAtUtc = DateTime.UtcNow,
                SentAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(14)
            };

            _dbContext.ClassInvites.Add(classInvite);
            return (classInvite, rawInviteCode);
        }

        private async Task<string> GenerateUniqueStudentUserNameAsync(
            string email,
            string studentCode)
        {
            var seed = AcademicCodeFactory.CreateUserNameSeed(email, studentCode);
            var candidate = seed;

            while (await _userManager.FindByNameAsync(candidate) is not null)
            {
                candidate = $"{seed}{AcademicCodeFactory.GenerateInviteCode(4).ToLowerInvariant()}";
            }

            return candidate;
        }

        private async Task<EmailMessage> CreateActivationInviteEmailAsync(
            ApplicationUser user,
            Classroom classroom,
            string rawInviteCode,
            CancellationToken cancellationToken)
        {
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedResetToken = EmailTokenCodec.Encode(resetToken);
            var resetPasswordUrl = QueryHelpers.AddQueryString(
                BuildFrontendUrl(_appUrlOptions.ResetPasswordPath),
                new Dictionary<string, string?>
                {
                    ["email"] = user.Email,
                    ["token"] = encodedResetToken
                });

            var joinUrl = QueryHelpers.AddQueryString(
                BuildFrontendUrl(_appUrlOptions.StudentDashboardPath),
                new Dictionary<string, string?>
                {
                    ["inviteCode"] = rawInviteCode
                });

            return AuthEmailTemplateFactory.CreateStudentActivationInviteMessage(
                user.Email ?? string.Empty,
                "Examxy",
                classroom.Name,
                resetPasswordUrl,
                rawInviteCode,
                joinUrl);
        }

        private EmailMessage CreateClassInviteEmail(
            string email,
            Classroom classroom,
            string rawInviteCode)
        {
            var joinUrl = QueryHelpers.AddQueryString(
                BuildFrontendUrl(_appUrlOptions.StudentDashboardPath),
                new Dictionary<string, string?>
                {
                    ["inviteCode"] = rawInviteCode
                });

            return AuthEmailTemplateFactory.CreateStudentClassInviteMessage(
                email,
                "Examxy",
                classroom.Name,
                rawInviteCode,
                joinUrl);
        }

        private string BuildFrontendUrl(string path)
        {
            return new Uri(new Uri(_appUrlOptions.FrontendBaseUrl), path).ToString();
        }

        private static RosterImportPreviewItemDto CreatePreviewItem(
            int rowNumber,
            string fullName,
            string studentCode,
            string email,
            string status,
            string action,
            IReadOnlyCollection<string> warnings,
            IReadOnlyCollection<string> errors)
        {
            return new RosterImportPreviewItemDto
            {
                RowNumber = rowNumber,
                FullName = fullName,
                StudentCode = studentCode,
                Email = email,
                Status = status,
                Action = action,
                Warnings = warnings.ToArray(),
                Errors = errors.ToArray()
            };
        }

        private void AddItem(
            StudentImportBatch batch,
            int rowNumber,
            string fullName,
            string studentCode,
            string email,
            StudentImportItemResultType resultType,
            string message,
            string? studentUserId = null,
            Guid? classInviteId = null)
        {
            var item = new StudentImportItem
            {
                Id = Guid.NewGuid(),
                BatchId = batch.Id,
                RowNumber = rowNumber,
                FullName = fullName,
                StudentCode = studentCode,
                Email = email,
                ResultType = resultType,
                Message = message,
                StudentUserId = studentUserId,
                ClassInviteId = classInviteId
            };

            batch.Items.Add(item);
            _dbContext.StudentImportItems.Add(item);
        }
    }
}
