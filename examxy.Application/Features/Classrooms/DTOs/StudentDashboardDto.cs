namespace examxy.Application.Features.Classrooms.DTOs
{
    /// <summary>
    /// Student dashboard payload used after student registration or login.
    /// </summary>
    public class StudentDashboardDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        /// <summary>
        /// Current onboarding state for the student profile.
        /// </summary>
        public string OnboardingState { get; set; } = string.Empty;

        /// <summary>
        /// Active or historical class memberships visible in the student dashboard.
        /// </summary>
        public IReadOnlyCollection<StudentDashboardClassDto> Classes { get; set; } = Array.Empty<StudentDashboardClassDto>();

        /// <summary>
        /// Unclaimed invites that the student can act on from the dashboard.
        /// </summary>
        public IReadOnlyCollection<StudentPendingInviteDto> PendingInvites { get; set; } = Array.Empty<StudentPendingInviteDto>();
    }
}
