using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class ClaimClassInviteRequestDto
    {
        [Required]
        [StringLength(128, MinimumLength = 6)]
        public string InviteCode { get; set; } = string.Empty;
    }
}
