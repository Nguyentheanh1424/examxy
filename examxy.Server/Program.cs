using examxy.Application.Abstractions.Identity;
using examxy.Application.Features.Realtime;
using examxy.Infrastructure.Identity.DependencyInjection;
using examxy.Infrastructure.Identity.Services;
using examxy.Server.Filters;
using examxy.Server.Middleware;
using examxy.Server.OpenApi;
using examxy.Server.Realtime;
using examxy.Server.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers(options =>
{
    options.Filters.Add(new ValidateModelStateFilter());
});

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddExamxySwagger(builder.Configuration);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSignalR();
builder.Services.AddScoped<IRealtimeEventPublisher, SignalRRealtimeEventPublisher>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        AuthorizationPolicies.TeacherOnly,
        policy => policy.RequireRole(IdentityRoles.Teacher));

    options.AddPolicy(
        AuthorizationPolicies.StudentOnly,
        policy => policy.RequireRole(IdentityRoles.Student));

    options.AddPolicy(
        AuthorizationPolicies.AdminOnly,
        policy => policy.RequireRole(IdentityRoles.Admin));

    var internalHeaderName = builder.Configuration["InternalAdminProvisioning:HeaderName"] ?? string.Empty;
    var internalSharedSecret = builder.Configuration["InternalAdminProvisioning:SharedSecret"] ?? string.Empty;

    options.AddPolicy(
        AuthorizationPolicies.InternalAdminSecret,
        policy => policy.RequireAssertion(context =>
        {
            var httpContext = context.Resource switch
            {
                HttpContext directContext => directContext,
                AuthorizationFilterContext filterContext => filterContext.HttpContext,
                _ => null
            };

            if (httpContext is null ||
                string.IsNullOrWhiteSpace(internalHeaderName) ||
                string.IsNullOrWhiteSpace(internalSharedSecret))
            {
                return false;
            }

            if (!httpContext.Request.Headers.TryGetValue(internalHeaderName, out var providedSecret))
            {
                return false;
            }

            return string.Equals(
                providedSecret.ToString(),
                internalSharedSecret,
                StringComparison.Ordinal);
        }));
});

var app = builder.Build();

// Bootstrap minimal identity state
using (var scope = app.Services.CreateScope())
{
    var bootstrapper = scope.ServiceProvider.GetRequiredService<IdentityBootstrapService>();
    await bootstrapper.EnsureSystemRolesAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RealtimeHub>("/hubs/realtime");

app.Run();

public partial class Program
{
}
