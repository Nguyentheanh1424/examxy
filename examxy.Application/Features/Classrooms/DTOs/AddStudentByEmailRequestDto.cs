using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Features.Classrooms.DTOs
{
    public class AddStudentByEmailRequestDto
    {
        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty;
    }
}
