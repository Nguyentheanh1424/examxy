using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Public teacher self-signup request.
    /// </summary>
    public class RegisterRequestDto
    {
        /// <summary>
        /// Optional human-readable name for the teacher profile.
        /// </summary>
        [StringLength(120)]
        public string FullName { get; set; } = string.Empty;

        /// <summary>
        /// Unique username for login and display.
        /// </summary>
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// Email address used for confirmation and account recovery.
        /// </summary>
        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Initial password for the new account.
        /// </summary>
        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Confirmation value that must match <see cref="Password" />.
        /// </summary>
        [Required]
        [Compare(nameof(Password), ErrorMessage = "ConfirmPassword must match Password.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
