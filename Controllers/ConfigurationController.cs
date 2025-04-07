using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Enums;
using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using System.Dynamic;

namespace TrackMate.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ConfigurationController : BaseController
    {
        private readonly IConfigurationService _configService;
        private readonly ILogger<ConfigurationController> _logger;
        private readonly IConfiguration _configuration;

        public ConfigurationController(
            IConfigurationService configService,
            ILogger<ConfigurationController> logger,
            IConfiguration configuration)
        {
            _configService = configService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet]
        [Authorize(Roles = "Dev,Admin")]
        public async Task<IActionResult> GetConfiguration()
        {
            try
            {
                var config = await _configService.GetConfigurationAsync();
                return Ok(config);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system configuration");
                return StatusCode(500, "An error occurred while retrieving system configuration");
            }
        }

        [HttpPut]
        [Authorize(Roles = "Dev")]
        public async Task<IActionResult> UpdateConfiguration([FromBody] SystemConfigurationDto configDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Update the UpdatedBy field with the current user
                configDto.UpdatedBy = GetCurrentUsername();
                configDto.LastUpdated = DateTime.UtcNow;
                
                await _configService.UpdateConfigurationAsync(configDto);
                return Ok(new { message = "Configuration updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating system configuration");
                return StatusCode(500, "An error occurred while updating system configuration");
            }
        }

        [HttpGet("maintenance-status")]
        [AllowAnonymous]
        public async Task<IActionResult> GetMaintenanceStatus()
        {
            try
            {
                var isActive = await _configService.IsMaintenanceModeActiveAsync();
                return Ok(new { maintenanceMode = isActive });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking maintenance mode");
                return StatusCode(500, "An error occurred while checking maintenance mode");
            }
        }

        [HttpGet("registration-status")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRegistrationStatus()
        {
            try
            {
                var isEnabled = await _configService.IsUserRegistrationEnabledAsync();
                return Ok(new { registrationEnabled = isEnabled });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking registration status");
                return StatusCode(500, "An error occurred while checking registration status");
            }
        }

        [HttpPost("toggle-maintenance")]
        [Authorize(Roles = "Dev")]
        public async Task<IActionResult> ToggleMaintenanceMode()
        {
            try
            {
                var config = await _configService.GetConfigurationAsync();
                config.MaintenanceMode = !config.MaintenanceMode;
                config.UpdatedBy = GetCurrentUsername();
                config.LastUpdated = DateTime.UtcNow;
                
                await _configService.UpdateConfigurationAsync(config);
                
                return Ok(new { 
                    message = $"Maintenance mode {(config.MaintenanceMode ? "activated" : "deactivated")} successfully",
                    maintenanceMode = config.MaintenanceMode
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling maintenance mode");
                return StatusCode(500, "An error occurred while toggling maintenance mode");
            }
        }

        [HttpPost("toggle-registration")]
        [Authorize(Roles = "Dev,Admin")]
        public async Task<IActionResult> ToggleRegistration()
        {
            try
            {
                var config = await _configService.GetConfigurationAsync();
                config.UserRegistration = !config.UserRegistration;
                config.UpdatedBy = GetCurrentUsername();
                config.LastUpdated = DateTime.UtcNow;
                
                await _configService.UpdateConfigurationAsync(config);
                
                return Ok(new { 
                    message = $"User registration {(config.UserRegistration ? "enabled" : "disabled")} successfully",
                    registrationEnabled = config.UserRegistration
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling registration");
                return StatusCode(500, "An error occurred while toggling registration");
            }
        }

        [HttpGet("smtp")]
        [Authorize(Roles = "Dev")]
        public IActionResult GetSmtpSettings()
        {
            try
            {
                var smtpSettings = _configuration.GetSection("SmtpSettings");
                
                var settings = new
                {
                    host = smtpSettings["Host"],
                    port = int.Parse(smtpSettings["Port"]),
                    enableSsl = bool.Parse(smtpSettings["EnableSsl"]),
                    username = smtpSettings["Username"],
                    password = smtpSettings["Password"],
                    from = smtpSettings["From"]
                };
                
                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving SMTP settings");
                return StatusCode(500, "An error occurred while retrieving SMTP settings");
            }
        }

        [HttpPost("smtp")]
        [Authorize(Roles = "Dev")]
        public async Task<IActionResult> UpdateSmtpSettings([FromBody] SmtpSettingsDto settings)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Get the current appsettings.json file path
                string appSettingsPath = Path.Combine(Directory.GetCurrentDirectory(), "appsettings.json");
                
                // Read the current file
                string json = await System.IO.File.ReadAllTextAsync(appSettingsPath);
                
                // Parse the JSON
                var appSettings = JsonDocument.Parse(json).RootElement;
                var jsonObject = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
                
                // Create updated settings
                var smtpSettings = new Dictionary<string, object>
                {
                    { "Host", settings.Host },
                    { "Port", settings.Port },
                    { "EnableSsl", settings.EnableSsl },
                    { "Username", settings.Username },
                    { "Password", settings.Password },
                    { "From", settings.From }
                };
                
                // Update the SMTP settings
                if (jsonObject.ContainsKey("SmtpSettings"))
                {
                    jsonObject["SmtpSettings"] = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(smtpSettings));
                }
                
                // Save the updated appsettings.json file
                var options = new JsonSerializerOptions { WriteIndented = true };
                await System.IO.File.WriteAllTextAsync(appSettingsPath, JsonSerializer.Serialize(jsonObject, options));
                
                return Ok(new { message = "SMTP settings updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating SMTP settings");
                return StatusCode(500, "An error occurred while updating SMTP settings: " + ex.Message);
            }
        }

        [HttpPost("test-email")]
        [Authorize(Roles = "Dev")]
        public async Task<IActionResult> SendTestEmail([FromBody] TestEmailDto request, [FromServices] IEmailService emailService)
        {
            if (string.IsNullOrEmpty(request.Recipient))
            {
                return BadRequest("Recipient email is required");
            }

            try
            {
                if (emailService == null)
                {
                    return StatusCode(500, "Email service is not available");
                }
                
                var result = await emailService.SendEmailAsync(
                    request.Recipient,
                    "TrackMate Test Email",
                    "<h1>Test Email</h1><p>This is a test email sent from the TrackMate system. If you received this email, your SMTP settings are working correctly.</p>",
                    1, // Assuming company ID 1 for system emails
                    null
                );
                
                if (result)
                {
                    return Ok(new { message = "Test email sent successfully" });
                }
                else
                {
                    return StatusCode(500, "Failed to send test email");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test email");
                return StatusCode(500, "An error occurred while sending test email: " + ex.Message);
            }
        }
    }
} 