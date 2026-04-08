using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class CreateTeacherClassRequestDto
    {
        [Required]
        [StringLength(120, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [StringLength(24, MinimumLength = 3)]
        public string? Code { get; set; }
    }
}
