using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ShopWave.Models.Responses;

namespace ShopWave.Filters
{
    public class ValidationFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var errors = context.ModelState
                    .Where(kv => kv.Value?.Errors.Count > 0)
                    .SelectMany(kv => kv.Value!.Errors.Select(e => new ErrorItem(kv.Key, e.ErrorMessage, "VALIDATION_ERROR")))
                    .ToList();

                var envelope = EnvelopeBuilder.Fail<object>(context.HttpContext, "VALIDATION_FAILED", errors, StatusCodes.Status400BadRequest);
                context.Result = new JsonResult(envelope) { StatusCode = StatusCodes.Status400BadRequest };
            }
        }

        public void OnActionExecuted(ActionExecutedContext context) { }
    }
}
