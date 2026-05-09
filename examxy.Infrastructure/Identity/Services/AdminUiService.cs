using examxy.Application.Abstractions.Identity;
using examxy.Application.Abstractions.Identity.DTOs;
using examxy.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace examxy.Infrastructure.Identity.Services
{
    public sealed class AdminUiService : IAdminUiService
    {
        private const int DefaultPage = 1;
        private const int DefaultPageSize = 25;
        private const int MaxPageSize = 100;

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IIdentityAdministrationService _identityAdministrationService;
        private readonly AppDbContext _dbContext;

        public AdminUiService(
            UserManager<ApplicationUser> userManager,
            IIdentityAdministrationService identityAdministrationService,
            AppDbContext dbContext)
        {
            _userManager = userManager;
            _identityAdministrationService = identityAdministrationService;
            _dbContext = dbContext;
        }

        public async Task<AdminDashboardSummaryDto> GetDashboardAsync(
            CancellationToken cancellationToken = default)
        {
            var users = await BuildUserSummariesAsync(cancellationToken);
            var audit = await _identityAdministrationService.AuditIdentityIntegrityAsync(cancellationToken);
            var health = ResolveHealth(audit.Issues.Count);

            return new AdminDashboardSummaryDto
            {
                ContractStatus = "ApiReady",
                UserCount = users.Count,
                ActiveTeacherCount = users.Count(user => user.PrimaryRole == IdentityRoles.Teacher && user.Status == "Active"),
                ActiveStudentCount = users.Count(user => user.PrimaryRole == IdentityRoles.Student && user.Status == "Active"),
                UnresolvedAuditCount = audit.Issues.Count,
                ServiceHealth = health
            };
        }

        public async Task<AdminPagedResultDto<AdminUserSummaryDto>> GetUsersAsync(
            AdminUsersQueryDto query,
            CancellationToken cancellationToken = default)
        {
            var users = await BuildUserSummariesAsync(cancellationToken);
            var filtered = users.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query.Query))
            {
                var normalizedQuery = query.Query.Trim();
                filtered = filtered.Where(user =>
                    Contains(user.UserName, normalizedQuery) ||
                    Contains(user.Email, normalizedQuery) ||
                    Contains(user.PrimaryRole, normalizedQuery) ||
                    Contains(user.Status, normalizedQuery));
            }

            if (!string.IsNullOrWhiteSpace(query.Role))
            {
                filtered = filtered.Where(user =>
                    string.Equals(user.PrimaryRole, query.Role.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                filtered = filtered.Where(user =>
                    string.Equals(user.Status, query.Status.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            return Page(filtered, query.Page, query.PageSize);
        }

        public async Task<AdminPagedResultDto<AdminAuditEventDto>> GetAuditEventsAsync(
            AdminAuditQueryDto query,
            CancellationToken cancellationToken = default)
        {
            var audit = await _identityAdministrationService.AuditIdentityIntegrityAsync(cancellationToken);
            var checkedAtUtc = DateTime.UtcNow;
            var events = audit.Issues
                .Select((issue, index) => new AdminAuditEventDto
                {
                    Id = $"{issue.IssueType}:{issue.UserId}:{index + 1}",
                    OccurredAtUtc = checkedAtUtc,
                    Actor = "system",
                    Module = "Identity",
                    Severity = "Warning",
                    Action = FormatIssueType(issue.IssueType),
                    Summary = $"{issue.UserName} ({issue.Email}): {issue.Details}"
                })
                .ToArray();

            var filtered = events.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query.Query))
            {
                var normalizedQuery = query.Query.Trim();
                filtered = filtered.Where(auditEvent =>
                    Contains(auditEvent.Actor, normalizedQuery) ||
                    Contains(auditEvent.Module, normalizedQuery) ||
                    Contains(auditEvent.Severity, normalizedQuery) ||
                    Contains(auditEvent.Action, normalizedQuery) ||
                    Contains(auditEvent.Summary, normalizedQuery));
            }

            if (!string.IsNullOrWhiteSpace(query.Module))
            {
                filtered = filtered.Where(auditEvent =>
                    string.Equals(auditEvent.Module, query.Module.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(query.Severity))
            {
                filtered = filtered.Where(auditEvent =>
                    string.Equals(auditEvent.Severity, query.Severity.Trim(), StringComparison.OrdinalIgnoreCase));
            }

            if (query.From.HasValue)
            {
                filtered = filtered.Where(auditEvent => auditEvent.OccurredAtUtc >= query.From.Value);
            }

            if (query.To.HasValue)
            {
                filtered = filtered.Where(auditEvent => auditEvent.OccurredAtUtc <= query.To.Value);
            }

            return Page(filtered, query.Page, query.PageSize);
        }

        public async Task<IReadOnlyCollection<AdminSystemHealthSummaryDto>> GetSystemHealthAsync(
            CancellationToken cancellationToken = default)
        {
            var checkedAtUtc = DateTime.UtcNow;
            var databaseTimer = Stopwatch.StartNew();
            var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
            databaseTimer.Stop();

            var auditTimer = Stopwatch.StartNew();
            var audit = await _identityAdministrationService.AuditIdentityIntegrityAsync(cancellationToken);
            auditTimer.Stop();

            return new[]
            {
                new AdminSystemHealthSummaryDto
                {
                    Service = "Server API",
                    Status = "Healthy",
                    LatencyMs = 0,
                    CheckedAtUtc = checkedAtUtc,
                    Message = "Authenticated Admin UI API is available."
                },
                new AdminSystemHealthSummaryDto
                {
                    Service = "Database",
                    Status = canConnect ? "Healthy" : "Unavailable",
                    LatencyMs = ElapsedMilliseconds(databaseTimer),
                    CheckedAtUtc = checkedAtUtc,
                    Message = canConnect
                        ? "Application database connection is available."
                        : "Application database connection failed."
                },
                new AdminSystemHealthSummaryDto
                {
                    Service = "Identity integrity",
                    Status = audit.Issues.Count == 0 ? "Healthy" : "Degraded",
                    LatencyMs = ElapsedMilliseconds(auditTimer),
                    CheckedAtUtc = checkedAtUtc,
                    Message = audit.Issues.Count == 0
                        ? "No identity integrity issues were detected."
                        : $"{audit.Issues.Count} identity integrity issue(s) need review."
                }
            };
        }

        private async Task<IReadOnlyCollection<AdminUserSummaryDto>> BuildUserSummariesAsync(
            CancellationToken cancellationToken)
        {
            var now = DateTimeOffset.UtcNow;
            var users = await _userManager.Users
                .OrderByDescending(user => user.CreatedAtUtc)
                .ToArrayAsync(cancellationToken);
            var summaries = new List<AdminUserSummaryDto>(users.Length);

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                summaries.Add(new AdminUserSummaryDto
                {
                    Id = user.Id,
                    UserName = user.UserName ?? string.Empty,
                    Email = user.Email ?? string.Empty,
                    PrimaryRole = IdentityRoles.GetPrimaryRole(roles),
                    Status = ResolveUserStatus(user, now),
                    CreatedAtUtc = user.CreatedAtUtc,
                    LastSeenAtUtc = user.LastActivatedAtUtc
                });
            }

            return summaries;
        }

        private static AdminPagedResultDto<T> Page<T>(
            IEnumerable<T> source,
            int requestedPage,
            int requestedPageSize)
        {
            var page = Math.Max(DefaultPage, requestedPage);
            var pageSize = Math.Clamp(
                requestedPageSize <= 0 ? DefaultPageSize : requestedPageSize,
                1,
                MaxPageSize);
            var items = source.ToArray();

            return new AdminPagedResultDto<T>
            {
                Items = items
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToArray(),
                Page = page,
                PageSize = pageSize,
                TotalCount = items.Length
            };
        }

        private static string ResolveUserStatus(ApplicationUser user, DateTimeOffset now)
        {
            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > now)
            {
                return "Locked";
            }

            return user.EmailConfirmed ? "Active" : "PendingEmailConfirmation";
        }

        private static string ResolveHealth(int issueCount)
        {
            return issueCount == 0 ? "Healthy" : "Degraded";
        }

        private static bool Contains(string value, string query)
        {
            return value.Contains(query, StringComparison.OrdinalIgnoreCase);
        }

        private static string FormatIssueType(string issueType)
        {
            return issueType.Replace('_', ' ');
        }

        private static int ElapsedMilliseconds(Stopwatch stopwatch)
        {
            return (int)Math.Min(int.MaxValue, Math.Max(0, stopwatch.ElapsedMilliseconds));
        }
    }
}
