using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Features.TestData.DTOs
{
    public sealed class SeedClassDashboardTestDataRequestDto
    {
        [Required]
        [StringLength(64, MinimumLength = 3)]
        public string DatasetKey { get; set; } = "class-dashboard-v1";

        [Range(1, 200)]
        public int StudentCount { get; set; } = 30;
    }

    public sealed class SeedClassDashboardTestDataResponseDto
    {
        public string DatasetKey { get; set; } = string.Empty;

        public ClassDashboardSeedClassDto Class { get; set; } = new();

        public ClassDashboardSeedAccountDto Teacher { get; set; } = new();

        public int RequestedStudentCount { get; set; }

        public int SeededStudentCount { get; set; }

        public IReadOnlyCollection<ClassDashboardSeedAccountDto> Students { get; set; } =
            Array.Empty<ClassDashboardSeedAccountDto>();
    }

    public sealed class ClassDashboardSeedClassDto
    {
        public Guid ClassId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;

        public string OwnerTeacherUserId { get; set; } = string.Empty;
    }

    public sealed class ClassDashboardSeedAccountDto
    {
        public string UserId { get; set; } = string.Empty;

        public string UserName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string FullName { get; set; } = string.Empty;
    }
}
