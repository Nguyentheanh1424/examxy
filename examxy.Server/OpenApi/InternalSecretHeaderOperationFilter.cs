using examxy.Server.Contracts;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace examxy.Server.OpenApi;

public sealed class InternalSecretHeaderOperationFilter(
    string adminHeaderName,
    string testDataHeaderName) : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var relativePath = context.ApiDescription.RelativePath;
        if (string.IsNullOrWhiteSpace(relativePath) ||
            !relativePath.StartsWith("internal/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var requiredHeaderName = ResolveHeaderName(relativePath, adminHeaderName, testDataHeaderName);

        operation.Parameters ??= new List<IOpenApiParameter>();

        if (operation.Parameters.Any(parameter =>
                parameter.In == ParameterLocation.Header &&
                string.Equals(parameter.Name, requiredHeaderName, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        operation.Parameters.Add(new OpenApiParameter
        {
            Name = requiredHeaderName,
            In = ParameterLocation.Header,
            Required = true,
            Description = "Shared secret header required for internal operational endpoints.",
            Schema = new OpenApiSchema
            {
                Type = JsonSchemaType.String
            }
        });

        operation.Responses ??= new OpenApiResponses();
        operation.Responses.TryAdd(
            "403",
            CreateErrorResponse(
                "The shared secret header is missing or invalid.",
                context));
    }

    private static string ResolveHeaderName(
        string relativePath,
        string adminHeaderName,
        string testDataHeaderName)
    {
        if (relativePath.StartsWith("internal/test-data/", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(testDataHeaderName))
        {
            return testDataHeaderName;
        }

        if (!string.IsNullOrWhiteSpace(adminHeaderName))
        {
            return adminHeaderName;
        }

        return "X-Examxy-Internal-Admin-Secret";
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
