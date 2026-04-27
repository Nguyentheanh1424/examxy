using System.ComponentModel.DataAnnotations;

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
