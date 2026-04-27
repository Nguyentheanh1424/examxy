using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class ForgotPasswordRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
