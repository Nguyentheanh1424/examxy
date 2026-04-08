namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class StudentDashboardDto
    {
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string StudentCode { get; set; } = string.Empty;
        public string OnboardingState { get; set; } = string.Empty;
        public IReadOnlyCollection<StudentDashboardClassDto> Classes { get; set; } = Array.Empty<StudentDashboardClassDto>();
        public IReadOnlyCollection<StudentPendingInviteDto> PendingInvites { get; set; } = Array.Empty<StudentPendingInviteDto>();
    }
}
