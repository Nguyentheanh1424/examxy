using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class LogoutRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
