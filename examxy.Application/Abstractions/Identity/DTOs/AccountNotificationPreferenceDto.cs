using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Account-level notification channel preference.
    /// </summary>
    public class AccountNotificationPreferenceDto
    {
        [Required]
        [StringLength(80)]
        public string Id { get; set; } = string.Empty;

        [Required]
        [StringLength(120)]
        public string Label { get; set; } = string.Empty;

        [Required]
        [StringLength(24)]
        public string Channel { get; set; } = string.Empty;

        public bool Enabled { get; set; }
    }
}
