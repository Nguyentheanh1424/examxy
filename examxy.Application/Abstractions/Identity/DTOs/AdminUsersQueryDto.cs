namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class AdminUsersQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Query { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
    }
}
