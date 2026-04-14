using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace examxy.Server.OpenApi;

public sealed class DomainTagDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        swaggerDoc.Tags = new HashSet<OpenApiTag>
        {
            new()
            {
                Name = "Authentication",
                Description = "Public identity endpoints for registration, login, session lifecycle, and account recovery."
            },
            new()
            {
                Name = "Teacher Classes",
                Description = "Teacher-only APIs for class lifecycle management and roster imports."
            },
            new()
            {
                Name = "Class Content",
                Description = "Class-scoped APIs for dashboard feed, posts, comments, reactions, mentions, and schedules."
            },
            new()
            {
                Name = "Question Bank",
                Description = "Teacher-global question bank APIs for creating and versioning reusable questions."
            },
            new()
            {
                Name = "Class Assessments",
                Description = "Class assessment APIs for create/publish/attempt/submit and auto-graded results."
            },
            new()
            {
                Name = "Student Dashboard",
                Description = "Student-only APIs for dashboard hydration after registration or login."
            },
            new()
            {
                Name = "Student Invites",
                Description = "Student-only APIs for joining classes with invite codes."
            },
            new()
            {
                Name = "Internal Admin Provisioning",
                Description = "Internal-only operational APIs for provisioning administrator accounts with a shared secret header."
            },
            new()
            {
                Name = "Internal Identity Maintenance",
                Description = "Internal-only maintenance APIs for auditing and repairing identity role/profile integrity."
            }
        };
    }
}
