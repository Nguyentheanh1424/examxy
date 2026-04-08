using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class ImportStudentRosterRequestDto
    {
        [StringLength(200)]
        public string SourceFileName { get; set; } = string.Empty;

        [Required]
        [MinLength(1)]
        public IReadOnlyCollection<StudentRosterItemInputDto> Students { get; set; } = Array.Empty<StudentRosterItemInputDto>();
    }
}
