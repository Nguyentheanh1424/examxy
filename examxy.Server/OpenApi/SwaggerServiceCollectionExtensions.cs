using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace examxy.Server.OpenApi;

public static class SwaggerServiceCollectionExtensions
{
    public static IServiceCollection AddExamxySwagger(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Examxy API",
                Version = "v1",
            });

            options.SupportNonNullableReferenceTypes();
            options.OperationFilter<AuthorizeOperationFilter>();
            options.OperationFilter<DomainTagOperationFilter>();
            options.OperationFilter<InternalSecretHeaderOperationFilter>(
                configuration["InternalAdminProvisioning:HeaderName"] ??
                "X-Examxy-Internal-Admin-Secret");
            options.DocumentFilter<DomainTagDocumentFilter>();

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter a JWT bearer token in the format: Bearer {token}."
            });

            IncludeXmlComments(options, typeof(Program).Assembly, includeControllerXmlComments: true);
            IncludeXmlComments(options, typeof(examxy.Application.Abstractions.Identity.DTOs.AuthResponseDto).Assembly);
        });

        return services;
    }

    private static void IncludeXmlComments(
        SwaggerGenOptions options,
        Assembly assembly,
        bool includeControllerXmlComments = false)
    {
        var xmlPath = Path.Combine(AppContext.BaseDirectory, $"{assembly.GetName().Name}.xml");
        if (File.Exists(xmlPath))
        {
            options.IncludeXmlComments(xmlPath, includeControllerXmlComments);
        }
    }
}
