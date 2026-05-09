namespace examxy.Application.Abstractions.Identity.DTOs
{
    public sealed class AdminPagedResultDto<T>
    {
        public IReadOnlyCollection<T> Items { get; set; } = Array.Empty<T>();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
    }
}
