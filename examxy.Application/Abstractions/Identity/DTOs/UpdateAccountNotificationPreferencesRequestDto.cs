using System.ComponentModel.DataAnnotations;

namespace examxy.Application.Abstractions.Identity.DTOs
{
    /// <summary>
    /// Request for replacing account-level notification channel preferences.
    /// </summary>
    public class UpdateAccountNotificationPreferencesRequestDto
    {
        [Required]
        [MinLength(1)]
        public IReadOnlyCollection<AccountNotificationPreferenceDto> Preferences { get; set; } =
            Array.Empty<AccountNotificationPreferenceDto>();
    }
}
