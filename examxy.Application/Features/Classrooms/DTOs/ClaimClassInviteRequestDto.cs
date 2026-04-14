using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Request for claiming a class invite code from the student dashboard.
    /// </summary>
    public class ClaimClassInviteRequestDto
    {
        /// <summary>
        /// Invite code received from email or teacher instructions.
        /// </summary>
        [Required]
        [StringLength(128, MinimumLength = 6)]
        public string InviteCode { get; set; } = string.Empty;
    }
}
