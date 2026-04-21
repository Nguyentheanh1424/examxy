using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace examxy.Server.OpenApi;

public sealed class DomainTagOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var controllerName = context.ApiDescription.ActionDescriptor.RouteValues.TryGetValue(
            "controller",
            out var routeController)
            ? routeController
            : null;

        var tagName = controllerName switch
        {
            "Auth" => "Authentication",
            "TeacherClasses" => "Teacher Classes",
            "ClassContent" => "Class Content",
            "Notifications" => "Notifications",
            "QuestionBank" => "Question Bank",
            "ClassAssessments" => "Class Assessments",
            "PaperExamTemplates" => "Paper Exam Templates",
            "AssessmentPaperBindings" => "Assessment Paper Bindings",
            "OfflineAssessmentSubmissions" => "Offline Assessment Submissions",
            "StudentDashboard" => "Student Dashboard",
            "StudentInvites" => "Student Invites",
            "InternalAdminUsers" => "Internal Admin Provisioning",
            "InternalIdentityAdministration" => "Internal Identity Maintenance",
            _ => controllerName ?? "API"
        };

        operation.Tags = new HashSet<OpenApiTagReference>
        {
            new(tagName, null, null)
        };
    }
}
