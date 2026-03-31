using examxy.Application.Abstractions.Identity;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;

namespace examxy.Infrastructure.Identity.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        public string? UserId =>
            User?.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User?.FindFirstValue("sub");

        public string? Email =>
            User?.FindFirstValue(ClaimTypes.Email) ??
            User?.FindFirstValue(JwtRegisteredClaimNames.Email);

        public string? UserName =>
            User?.FindFirstValue(ClaimTypes.Name) ??
            User?.FindFirstValue(JwtRegisteredClaimNames.UniqueName);

        public bool IsAuthenticated =>
            User?.Identity?.IsAuthenticated ?? false;

        public bool IsInRole(string role)
        {
            return User?.IsInRole(role) ?? false;
        }
    }
}
