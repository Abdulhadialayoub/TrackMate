using FluentValidation;
using FluentValidation.AspNetCore;
using TrackMate.API.Extensions;
using TrackMate.API.Middleware;
using TrackMate.API.Data;
using TrackMate.API.Tools;

var builder = WebApplication.CreateBuilder(args);

// Core Services
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddEndpointsApiExplorer();

// Add Services
builder.Services.AddDatabaseConfiguration(builder.Configuration, builder.Environment);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddSwaggerConfiguration();
builder.Services.AddApplicationServices();
builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Configure Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // Manual Dev user creation - this is more reliable
    try
    {
        await CreateDevUser.CreateDevUserManuallyAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to create Dev user: {ex.Message}");
    }
}

// Add maintenance mode middleware before other middlewares
app.UseMiddleware<MaintenanceModeMiddleware>();

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

app.UseMiddleware<ValidationMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();