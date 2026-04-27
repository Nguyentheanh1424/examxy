using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class ResetPasswordRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string NewPassword { get; set; } = string.Empty;

        [Required]
        [Compare(nameof(NewPassword), ErrorMessage = "ConfirmNewPassword must match NewPassword.")]
        public string ConfirmNewPassword { get; set; } = string.Empty;
    }
}
