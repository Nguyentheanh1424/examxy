using examxy.Application.Abstractions.Identity;
using examxy.Application.Exceptions;
using examxy.Application.Features.TestData;
using examxy.Application.Features.TestData.DTOs;
using examxy.Domain.Classrooms;
using examxy.Infrastructure.Identity;
using examxy.Infrastructure.Identity.Services;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace examxy.Infrastructure.Features.TestData
{
    public sealed class ClassDashboardTestDataSeedService : ITestDataSeedService
    {
        public const string SupportedDatasetKey = "class-dashboard-v1";
        public const string DefaultAccountPassword = "Pass123";

        private const string TeacherUserName = "teacher.classdashboard.v1";
        private const string TeacherEmail = "teacher.classdashboard.v1@examxy.local";
        private const string TeacherFullName = "Teacher Class Dashboard V1";
        private const string ClassCode = "CLASSDASHV1";
        private const string ClassName = "Class Dashboard V1";
        private const string ClassTimezoneId = "Asia/Ho_Chi_Minh";

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleAssignmentService _roleAssignmentService;
        private readonly AppDbContext _dbContext;

        public ClassDashboardTestDataSeedService(
            UserManager<ApplicationUser> userManager,
            RoleAssignmentService roleAssignmentService,
            AppDbContext dbContext)
        {
            _userManager = userManager;
            _roleAssignmentService = roleAssignmentService;
            _dbContext = dbContext;
        }

        public async Task<SeedClassDashboardTestDataResponseDto> SeedClassDashboardV1Async(
            SeedClassDashboardTestDataRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var normalizedDatasetKey = NormalizeDatasetKey(request.DatasetKey);
            if (!string.Equals(normalizedDatasetKey, SupportedDatasetKey, StringComparison.Ordinal))
            {
                throw new ValidationException(
                    "Unsupported dataset key.",
                    new Dictionary<string, string[]>
                    {
                        [nameof(request.DatasetKey)] = new[]
                        {
                            $"DatasetKey must be '{SupportedDatasetKey}'."
                        }
                    });
            }

            if (request.StudentCount < 1)
            {
                throw new ValidationException(
                    "StudentCount must be greater than 0.",
                    new Dictionary<string, string[]>
                    {
                        [nameof(request.StudentCount)] = new[]
                        {
                            "StudentCount must be greater than 0."
                        }
                    });
            }

            await _roleAssignmentService.EnsureRoleExistsAsync(IdentityRoles.Teacher);
            await _roleAssignmentService.EnsureRoleExistsAsync(IdentityRoles.Student);

            var teacher = await EnsureTeacherAccountAsync(cancellationToken);
            var classroom = await EnsureClassroomAsync(teacher.Id, cancellationToken);

            var seededStudents = new List<ClassDashboardSeedAccountDto>(request.StudentCount);
            for (var index = 1; index <= request.StudentCount; index++)
            {
                var student = await EnsureStudentAccountAsync(index, cancellationToken);
                await EnsureClassMembershipAsync(classroom.Id, student.UserId, cancellationToken);
                seededStudents.Add(student);
            }

            await _dbContext.SaveChangesAsync(cancellationToken);

            return new SeedClassDashboardTestDataResponseDto
            {
                DatasetKey = SupportedDatasetKey,
                Class = new ClassDashboardSeedClassDto
                {
                    ClassId = classroom.Id,
                    Name = classroom.Name,
                    Code = classroom.Code,
                    OwnerTeacherUserId = classroom.OwnerTeacherUserId
                },
                Teacher = ToAccountDto(teacher),
                RequestedStudentCount = request.StudentCount,
                SeededStudentCount = seededStudents.Count,
                Students = seededStudents
            };
        }

        private async Task<ApplicationUser> EnsureTeacherAccountAsync(CancellationToken cancellationToken)
        {
            var teacher = await _userManager.FindByEmailAsync(TeacherEmail);
            if (teacher is null)
            {
                teacher = new ApplicationUser
                {
                    UserName = TeacherUserName,
                    Email = TeacherEmail,
                    EmailConfirmed = true,
                    FullName = TeacherFullName,
                    CreatedAtUtc = DateTime.UtcNow,
                    LastActivatedAtUtc = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(teacher, DefaultAccountPassword);
                if (!createResult.Succeeded)
                {
                    throw IdentityExceptionFactory.CreateFromErrors(createResult.Errors);
                }
            }
            else
            {
                var now = DateTime.UtcNow;
                var requiresUpdate = false;

                requiresUpdate |= UpdateIfChanged(teacher.UserName, TeacherUserName, value => teacher.UserName = value);
                requiresUpdate |= UpdateIfChanged(teacher.Email, TeacherEmail, value => teacher.Email = value);
                requiresUpdate |= UpdateIfChanged(teacher.FullName, TeacherFullName, value => teacher.FullName = value);

                if (!teacher.EmailConfirmed)
                {
                    teacher.EmailConfirmed = true;
                    requiresUpdate = true;
                }

                if (teacher.LastActivatedAtUtc is null)
                {
                    teacher.LastActivatedAtUtc = now;
                    requiresUpdate = true;
                }

                if (requiresUpdate)
                {
                    var updateResult = await _userManager.UpdateAsync(teacher);
                    if (!updateResult.Succeeded)
                    {
                        throw IdentityExceptionFactory.CreateFromErrors(updateResult.Errors);
                    }
                }
            }

            await _roleAssignmentService.SetSingleRoleAsync(teacher, IdentityRoles.Teacher);
            await EnsurePasswordAsync(teacher, DefaultAccountPassword);
            await EnsureTeacherProfileAsync(teacher.Id, cancellationToken);

            return teacher;
        }

        private async Task<ClassDashboardSeedAccountDto> EnsureStudentAccountAsync(
            int index,
            CancellationToken cancellationToken)
        {
            var userName = BuildStudentUserName(index);
            var email = BuildStudentEmail(index);
            var fullName = BuildStudentFullName(index);
            var studentCode = BuildStudentCode(index);

            var student = await _userManager.FindByEmailAsync(email);
            if (student is null)
            {
                student = new ApplicationUser
                {
                    UserName = userName,
                    Email = email,
                    EmailConfirmed = true,
                    FullName = fullName,
                    CreatedAtUtc = DateTime.UtcNow,
                    LastActivatedAtUtc = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(student, DefaultAccountPassword);
                if (!createResult.Succeeded)
                {
                    throw IdentityExceptionFactory.CreateFromErrors(createResult.Errors);
                }
            }
            else
            {
                var now = DateTime.UtcNow;
                var requiresUpdate = false;

                requiresUpdate |= UpdateIfChanged(student.UserName, userName, value => student.UserName = value);
                requiresUpdate |= UpdateIfChanged(student.Email, email, value => student.Email = value);
                requiresUpdate |= UpdateIfChanged(student.FullName, fullName, value => student.FullName = value);

                if (!student.EmailConfirmed)
                {
                    student.EmailConfirmed = true;
                    requiresUpdate = true;
                }

                if (student.LastActivatedAtUtc is null)
                {
                    student.LastActivatedAtUtc = now;
                    requiresUpdate = true;
                }

                if (requiresUpdate)
                {
                    var updateResult = await _userManager.UpdateAsync(student);
                    if (!updateResult.Succeeded)
                    {
                        throw IdentityExceptionFactory.CreateFromErrors(updateResult.Errors);
                    }
                }
            }

            await _roleAssignmentService.SetSingleRoleAsync(student, IdentityRoles.Student);
            await EnsurePasswordAsync(student, DefaultAccountPassword);
            await EnsureStudentProfileAsync(student.Id, studentCode, cancellationToken);

            return ToAccountDto(student);
        }

        private async Task<Classroom> EnsureClassroomAsync(
            string teacherUserId,
            CancellationToken cancellationToken)
        {
            var classroom = await _dbContext.Classes
                .FirstOrDefaultAsync(candidate => candidate.Code == ClassCode, cancellationToken);

            if (classroom is null)
            {
                classroom = new Classroom
                {
                    Id = Guid.NewGuid(),
                    Name = ClassName,
                    Code = ClassCode,
                    OwnerTeacherUserId = teacherUserId,
                    Status = ClassStatus.Active,
                    TimezoneId = ClassTimezoneId,
                    CreatedAtUtc = DateTime.UtcNow
                };

                _dbContext.Classes.Add(classroom);
                return classroom;
            }

            var requiresSave = false;
            if (!string.Equals(classroom.Name, ClassName, StringComparison.Ordinal))
            {
                classroom.Name = ClassName;
                requiresSave = true;
            }

            if (!string.Equals(classroom.OwnerTeacherUserId, teacherUserId, StringComparison.Ordinal))
            {
                classroom.OwnerTeacherUserId = teacherUserId;
                requiresSave = true;
            }

            if (classroom.Status != ClassStatus.Active)
            {
                classroom.Status = ClassStatus.Active;
                requiresSave = true;
            }

            if (!string.Equals(classroom.TimezoneId, ClassTimezoneId, StringComparison.Ordinal))
            {
                classroom.TimezoneId = ClassTimezoneId;
                requiresSave = true;
            }

            if (requiresSave)
            {
                _dbContext.Classes.Update(classroom);
            }

            return classroom;
        }

        private async Task EnsureTeacherProfileAsync(string teacherUserId, CancellationToken cancellationToken)
        {
            var profile = await _dbContext.TeacherProfiles
                .FirstOrDefaultAsync(candidate => candidate.UserId == teacherUserId, cancellationToken);

            if (profile is not null)
            {
                return;
            }

            _dbContext.TeacherProfiles.Add(new TeacherProfile
            {
                UserId = teacherUserId,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        private async Task EnsureStudentProfileAsync(
            string studentUserId,
            string studentCode,
            CancellationToken cancellationToken)
        {
            var profile = await _dbContext.StudentProfiles
                .FirstOrDefaultAsync(candidate => candidate.UserId == studentUserId, cancellationToken);

            if (profile is null)
            {
                _dbContext.StudentProfiles.Add(new StudentProfile
                {
                    UserId = studentUserId,
                    StudentCode = studentCode,
                    OnboardingState = StudentOnboardingState.Active,
                    CreatedAtUtc = DateTime.UtcNow
                });
                return;
            }

            var requiresSave = false;

            if (!string.Equals(profile.StudentCode, studentCode, StringComparison.Ordinal))
            {
                profile.StudentCode = studentCode;
                requiresSave = true;
            }

            if (profile.OnboardingState != StudentOnboardingState.Active)
            {
                profile.OnboardingState = StudentOnboardingState.Active;
                requiresSave = true;
            }

            if (requiresSave)
            {
                _dbContext.StudentProfiles.Update(profile);
            }
        }

        private async Task EnsureClassMembershipAsync(
            Guid classId,
            string studentUserId,
            CancellationToken cancellationToken)
        {
            var membership = await _dbContext.ClassMemberships
                .FirstOrDefaultAsync(
                    candidate => candidate.ClassId == classId && candidate.StudentUserId == studentUserId,
                    cancellationToken);

            if (membership is null)
            {
                _dbContext.ClassMemberships.Add(new ClassMembership
                {
                    Id = Guid.NewGuid(),
                    ClassId = classId,
                    StudentUserId = studentUserId,
                    Status = ClassMembershipStatus.Active,
                    JoinedAtUtc = DateTime.UtcNow
                });
                return;
            }

            var requiresSave = false;
            if (membership.Status != ClassMembershipStatus.Active)
            {
                membership.Status = ClassMembershipStatus.Active;
                requiresSave = true;
            }

            if (membership.JoinedAtUtc is null)
            {
                membership.JoinedAtUtc = DateTime.UtcNow;
                requiresSave = true;
            }

            if (requiresSave)
            {
                _dbContext.ClassMemberships.Update(membership);
            }
        }

        private async Task EnsurePasswordAsync(ApplicationUser user, string password)
        {
            if (await _userManager.HasPasswordAsync(user))
            {
                var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
                var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, password);

                if (!resetResult.Succeeded)
                {
                    throw IdentityExceptionFactory.CreateFromErrors(resetResult.Errors);
                }

                return;
            }

            var addPasswordResult = await _userManager.AddPasswordAsync(user, password);
            if (!addPasswordResult.Succeeded)
            {
                throw IdentityExceptionFactory.CreateFromErrors(addPasswordResult.Errors);
            }
        }

        private static string NormalizeDatasetKey(string datasetKey)
        {
            return string.IsNullOrWhiteSpace(datasetKey)
                ? string.Empty
                : datasetKey.Trim().ToLowerInvariant();
        }

        private static bool UpdateIfChanged(
            string? currentValue,
            string desiredValue,
            Action<string> assignValue)
        {
            if (string.Equals(currentValue, desiredValue, StringComparison.Ordinal))
            {
                return false;
            }

            assignValue(desiredValue);
            return true;
        }

        private static string BuildStudentUserName(int index) => $"student{index:D2}.classdashboard.v1";

        private static string BuildStudentEmail(int index) => $"{BuildStudentUserName(index)}@examxy.local";

        private static string BuildStudentFullName(int index) => $"Student {index:D2} Class Dashboard V1";

        private static string BuildStudentCode(int index) => $"CDV1-S{index:D2}";

        private static ClassDashboardSeedAccountDto ToAccountDto(ApplicationUser user)
        {
            return new ClassDashboardSeedAccountDto
            {
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName
            };
        }
    }
}
