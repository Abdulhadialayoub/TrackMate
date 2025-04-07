using Microsoft.AspNetCore.Http;
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Middleware
{
    public class MaintenanceModeMiddleware
    {
        private readonly RequestDelegate _next;

        public MaintenanceModeMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IConfigurationService configService)
        {
            try
            {
                // Bypass maintenance mode check for certain paths
                string path = context.Request.Path.Value?.ToLower() ?? string.Empty;
                
                // Always allow access to the following endpoints:
                // - Configuration controller endpoints for checking or toggling maintenance mode
                // - Authentication endpoints for login (but not registration)
                if (path.StartsWith("/api/configuration/maintenance") ||
                    path.StartsWith("/api/auth/login") ||
                    path.Contains("/swagger"))
                {
                    await _next(context);
                    return;
                }
                
                // Check if maintenance mode is active
                bool isMaintenanceMode = await configService.IsMaintenanceModeActiveAsync();
                
                if (isMaintenanceMode)
                {
                    // Return 503 Service Unavailable with a JSON message
                    context.Response.StatusCode = (int)HttpStatusCode.ServiceUnavailable;
                    context.Response.ContentType = "application/json";
                    
                    var response = new 
                    {
                        status = 503,
                        message = "The system is currently in maintenance mode. Please try again later.",
                        maintenanceMode = true
                    };
                    
                    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                    return;
                }
                
                // Continue with the request pipeline if not in maintenance mode
                await _next(context);
            }
            catch (Exception)
            {
                // If we can't check maintenance mode, let the request proceed
                await _next(context);
            }
        }
    }
} 