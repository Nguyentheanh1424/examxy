using examxy.Server.Contracts;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace examxy.Server.OpenApi;

public sealed class InternalSecretHeaderOperationFilter(string headerName) : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (!context.ApiDescription.RelativePath?.StartsWith("internal/", StringComparison.OrdinalIgnoreCase) ?? true)
        {
            return;
        }

        operation.Parameters ??= new List<IOpenApiParameter>();

        if (operation.Parameters.Any(parameter =>
                parameter.In == ParameterLocation.Header &&
                string.Equals(parameter.Name, headerName, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        operation.Parameters.Add(new OpenApiParameter
        {
            Name = headerName,
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
