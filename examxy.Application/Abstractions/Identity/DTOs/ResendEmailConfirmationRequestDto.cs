using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class ResendEmailConfirmationRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
