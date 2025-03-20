using System.Net;
using System.Text.Json;
using FluentValidation;
using TrackMate.API.Exceptions;

namespace TrackMate.API.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = ex switch
                {
                    NotFoundException => (int)HttpStatusCode.NotFound,
                    FluentValidation.ValidationException => (int)HttpStatusCode.BadRequest,
                    _ => (int)HttpStatusCode.InternalServerError
                };

                object response;
                if (ex is FluentValidation.ValidationException validationException)
                {
                    var errors = validationException.Errors.GroupBy(x => x.PropertyName)
                        .ToDictionary(
                            g => g.Key,
                            g => g.Select(x => x.ErrorMessage).ToArray()
                        );

                    response = new
                    {
                        status = context.Response.StatusCode,
                        errors = errors,
                        title = "Validation Error"
                    };
                }
                else
                {
                    response = new
                    {
                        status = context.Response.StatusCode,
                        message = ex.Message,
                        title = ex.GetType().Name
                    };
                }

                _logger.LogError(ex, "An error occurred: {Message}", ex.Message);
                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        }
    }
} 