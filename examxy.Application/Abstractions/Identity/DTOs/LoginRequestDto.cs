using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class LoginRequestDto
    {
        [Required]
        public string UserNameOrEmail { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
