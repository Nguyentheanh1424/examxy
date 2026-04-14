using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Public student self-signup request.
    /// </summary>
    public class StudentRegisterRequestDto
    {
        /// <summary>
        /// Human-readable full name for the student profile.
        /// </summary>
        [StringLength(120)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string UserName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Optional student code displayed in dashboard and roster views.
        /// </summary>
        [StringLength(64)]
        public string StudentCode { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Compare(nameof(Password), ErrorMessage = "ConfirmPassword must match Password.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
