using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Request for creating a teacher-owned class.
    /// </summary>
    public class CreateTeacherClassRequestDto
    {
        /// <summary>
        /// Human-readable class name shown across teacher and student views.
        /// </summary>
        [Required]
        [StringLength(120, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Optional short class code; the server can generate one when omitted.
        /// </summary>
        [StringLength(24, MinimumLength = 3)]
        public string? Code { get; set; }
    }
}
