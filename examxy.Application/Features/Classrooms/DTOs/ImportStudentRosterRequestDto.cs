using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Batch roster import request for onboarding or inviting students into a class.
    /// </summary>
    public class ImportStudentRosterRequestDto
    {
        /// <summary>
        /// Optional source filename shown in import history and debugging.
        /// </summary>
        [StringLength(200)]
        public string SourceFileName { get; set; } = string.Empty;

        /// <summary>
        /// Student rows to process in the current import batch.
        /// </summary>
        [Required]
        [MinLength(1)]
        public IReadOnlyCollection<StudentRosterItemInputDto> Students { get; set; } = Array.Empty<StudentRosterItemInputDto>();
    }
}
