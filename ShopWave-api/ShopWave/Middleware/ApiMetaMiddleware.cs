using System.Diagnostics;

namespace ShopWave.Middleware
{
    public class ApiMetaMiddleware
    {
        private readonly RequestDelegate _next;
        public ApiMetaMiddleware(RequestDelegate next) => _next = next;

        public async Task Invoke(HttpContext context)
        {
            var sw = Stopwatch.StartNew();
            context.Items["TraceId"] = context.TraceIdentifier[..Math.Min(12, context.TraceIdentifier.Length)];
            try
            {
                await _next(context);
            }
            finally
            {
                sw.Stop();
                context.Items["DurationMs"] = sw.ElapsedMilliseconds;
            }
        }
    }

    public static class ApiMetaMiddlewareExtensions
    {
        public static IApplicationBuilder UseApiMeta(this IApplicationBuilder app)
            => app.UseMiddleware<ApiMetaMiddleware>();
    }
}
