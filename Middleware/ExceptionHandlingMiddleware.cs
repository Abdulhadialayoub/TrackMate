using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TrackMate.API.Exceptions;
using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private readonly IWebHostEnvironment _env;

        public ExceptionHandlingMiddleware(
            RequestDelegate next, 
            ILogger<ExceptionHandlingMiddleware> logger, 
            IWebHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (ApiException ex)
            {
                _logger.LogWarning(ex, "API Exception: {Message}", ex.Message);
                await WriteResponseAsync(context, ex.StatusCode, ex.Message, ex.Code);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled Exception");
                await WriteInternalServerErrorResponseAsync(context, ex);
            }
        }

        private async Task WriteResponseAsync(HttpContext context, int statusCode, string message, string errorCode)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var response = ResponseDto<object>.ErrorResponse(
                message, 
                new List<string> { $"Error Code: {errorCode}" }
            );

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }

        private async Task WriteInternalServerErrorResponseAsync(HttpContext context, Exception ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;

            var response = _env.IsDevelopment() 
                ? ResponseDto<object>.ErrorResponse(
                    "An internal server error occurred.", 
                    new List<string> { ex.Message, ex.StackTrace ?? "" })
                : ResponseDto<object>.ErrorResponse(
                    "An internal server error occurred.",
                    new List<string> { "Please contact administrator if the problem persists." });

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }
    }
} 