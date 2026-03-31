using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class ConfirmEmailRequestDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Token { get; set; } = string.Empty;
    }
}
