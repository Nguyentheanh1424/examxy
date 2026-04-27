namespace examxy.Domain.Classrooms;

public class StudentProfile
{
    public string UserId { get; set; } = string.Empty;
    public string? StudentCode { get; set; }
    public StudentOnboardingState OnboardingState { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
