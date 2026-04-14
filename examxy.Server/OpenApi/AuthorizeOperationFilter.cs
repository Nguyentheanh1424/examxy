using examxy.Server.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace examxy.Server.OpenApi;

public sealed class AuthorizeOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var metadata = context.ApiDescription.ActionDescriptor.EndpointMetadata;
        var allowsAnonymous = metadata.OfType<IAllowAnonymous>().Any();
        var requiresAuthorization = metadata.OfType<IAuthorizeData>().Any();

        if (allowsAnonymous || !requiresAuthorization)
        {
            return;
        }

        operation.Security ??= new List<OpenApiSecurityRequirement>();
        operation.Security.Add(new OpenApiSecurityRequirement
        {
            [
                new OpenApiSecuritySchemeReference("Bearer", null, null)
                {
                }
            ] = new List<string>()
        });

        operation.Responses ??= new OpenApiResponses();
        operation.Responses.TryAdd(
            "401",
            CreateErrorResponse(
                "Authentication is required or the bearer token is invalid.",
                context));
        operation.Responses.TryAdd(
            "403",
            CreateErrorResponse(
                "The authenticated user does not have permission to access this resource.",
                context));
    }

    private static OpenApiResponse CreateErrorResponse(
        string description,
        OperationFilterContext context)
    {
        return new OpenApiResponse
        {
            Description = description,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["application/json"] = new()
                {
                    Schema = context.SchemaGenerator.GenerateSchema(
                        typeof(ApiErrorResponse),
                        context.SchemaRepository)
                }
            }
        };
    }
}
