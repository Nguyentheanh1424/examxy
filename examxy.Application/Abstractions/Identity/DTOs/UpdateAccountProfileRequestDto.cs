using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Request for updating editable account profile fields.
    /// </summary>
    public class UpdateAccountProfileRequestDto
    {
        [Required]
        [StringLength(120)]
        public string FullName { get; set; } = string.Empty;

        [StringLength(32)]
        public string? PhoneNumber { get; set; }

        [Required]
        [StringLength(80)]
        public string TimeZoneId { get; set; } = "Asia/Ho_Chi_Minh";

        [StringLength(200)]
        public string? Bio { get; set; }
    }
}
