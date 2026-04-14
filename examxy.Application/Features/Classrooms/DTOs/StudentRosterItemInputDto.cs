using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// One student row inside a roster import batch.
    /// </summary>
    public class StudentRosterItemInputDto
    {
        [StringLength(120)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(64)]
        public string StudentCode { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty;
    }
}
