using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    public class LogoutRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
