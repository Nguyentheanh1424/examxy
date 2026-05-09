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

        /// <summary>
        /// Optional subject metadata shown in class setup and summaries.
        /// </summary>
        [StringLength(80)]
        public string? Subject { get; set; }

        /// <summary>
        /// Optional grade or level metadata.
        /// </summary>
        [StringLength(40)]
        public string? Grade { get; set; }

        /// <summary>
        /// Optional academic term metadata.
        /// </summary>
        [StringLength(80)]
        public string? Term { get; set; }

        /// <summary>
        /// Optional join mode. Defaults to InviteOnly when omitted.
        /// </summary>
        [StringLength(24)]
        public string? JoinMode { get; set; }
    }
}
