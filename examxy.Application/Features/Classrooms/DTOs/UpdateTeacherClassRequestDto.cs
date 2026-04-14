using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Request for updating class metadata owned by the authenticated teacher.
    /// </summary>
    public class UpdateTeacherClassRequestDto
    {
        [Required]
        [StringLength(120, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(24, MinimumLength = 3)]
        public string Code { get; set; } = string.Empty;

        /// <summary>
        /// Lifecycle state of the class. Supported values are <c>Active</c> and <c>Archived</c>.
        /// </summary>
        [Required]
        [RegularExpression("Active|Archived")]
        public string Status { get; set; } = "Active";
    }
}
