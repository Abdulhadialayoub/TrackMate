using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Middleware
{
    public class ValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ValidationMiddleware> _logger;

        public ValidationMiddleware(RequestDelegate next, ILogger<ValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);

                if (context.Response.StatusCode == StatusCodes.Status400BadRequest)
                {
                    var problemDetails = context.Items["ValidationProblemDetails"] as ValidationProblemDetails;
                    if (problemDetails != null)
                    {
                        var errors = problemDetails.Errors.SelectMany(e => e.Value).ToList();
                        await WriteResponseAsync(context, StatusCodes.Status400BadRequest, "Validation failed", errors);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred in ValidationMiddleware");
                await _next(context);
            }
        }

        private static async Task WriteResponseAsync(HttpContext context, int statusCode, string message, List<string>? errors = null)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var response = new ResponseDto<object>
            {
                Success = false,
                Message = message,
                Data = null,
                Errors = errors
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }
    }
} 