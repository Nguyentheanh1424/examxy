using System;
using System.Collections.Generic;
using System.Text;

namespace examxy.Application.Abstractions.Identity
{
    public interface ICurrentUserService
    {
        string? UserId { get; }
        string? Email { get; }
        string? UserName { get; }
        bool IsAuthenticated { get; }

        bool IsInRole(string role);
    }
}
