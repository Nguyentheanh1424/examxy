using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Login request using either a username or an email address.
    /// </summary>
    public class LoginRequestDto
    {
        /// <summary>
        /// Username or email used to identify the account.
        /// </summary>
        [Required]
        public string UserNameOrEmail { get; set; } = string.Empty;

        /// <summary>
        /// Account password.
        /// </summary>
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
