using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class UpdateTeacherClassRequestDto
    {
        [Required]
        [StringLength(120, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(24, MinimumLength = 3)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [RegularExpression("Active|Archived")]
        public string Status { get; set; } = "Active";
    }
}
