using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class RefreshTokenRequestDto
    {
        [Required]
        public string AccessToken { get; set; } = string.Empty;

        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
