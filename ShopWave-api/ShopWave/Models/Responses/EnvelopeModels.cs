namespace ShopWave.Models.Responses
{
    public record ErrorItem(string Field, string Message, string Code);

    public record Meta(long DurationMs, string TraceId, DateTime GeneratedAt);

    public record PagedResult<T>(
        IReadOnlyList<T> Data,
        int CurrentPage,
        int TotalPages,
        int PageSize,
        int TotalRecords,
        bool HasPreviousPage,
        bool HasNextPage,
        object? AppliedFilters,
        DateTime? LastUpdatedAt = null,
        bool? Partial = null,
        string? Locale = null,
        IReadOnlyList<string>? Warnings = null
    );

    public record Envelope<T>(
        bool Success,
        string Message,
        T? Data,
        IReadOnlyList<ErrorItem> Errors,
        Meta Meta
    );

    public static class EnvelopeBuilder
    {
        public static Envelope<T> Ok<T>(HttpContext ctx, string message, T data) =>
            new(true, message, data, Array.Empty<ErrorItem>(), BuildMeta(ctx));

        public static Envelope<T> Fail<T>(HttpContext ctx, string message, IEnumerable<ErrorItem>? errors, int httpStatus)
        {
            ctx.Response.StatusCode = httpStatus;
            return new(false, message, default, errors?.ToList() ?? new List<ErrorItem>(), BuildMeta(ctx));
        }

        private static Meta BuildMeta(HttpContext ctx) => new(
            DurationMs: (long)(ctx.Items["DurationMs"] ?? 0L),
            TraceId: (string)(ctx.Items["TraceId"] ?? ctx.TraceIdentifier),
            GeneratedAt: DateTime.UtcNow
        );
    }
}
