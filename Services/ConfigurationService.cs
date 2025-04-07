using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using TrackMate.API.Data;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Services
{
    public class ConfigurationService : IConfigurationService
    {
        private readonly TrackMateDbContext _context;
        private readonly ILogger<ConfigurationService> _logger;

        public ConfigurationService(
            TrackMateDbContext context,
            ILogger<ConfigurationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<SystemConfigurationDto> GetConfigurationAsync()
        {
            try
            {
                _logger.LogInformation("Getting system configuration");

                var config = await _context.SystemConfigurations.FirstOrDefaultAsync();
                
                if (config == null)
                {
                    // Eğer konfigürasyon yoksa, varsayılan değerlerle oluşturalım
                    config = new SystemConfiguration
                    {
                        MaintenanceMode = false,
                        UserRegistration = true,
                        DebugMode = false,
                        DefaultUserRole = "User",
                        SystemEmail = "system@trackmate.com",
                        Version = "1.0.0",
                        LastUpdated = DateTime.UtcNow,
                        UpdatedBy = "System"
                    };

                    _context.SystemConfigurations.Add(config);
                    await _context.SaveChangesAsync();
                }

                return new SystemConfigurationDto
                {
                    MaintenanceMode = config.MaintenanceMode,
                    UserRegistration = config.UserRegistration,
                    DebugMode = config.DebugMode,
                    DefaultUserRole = config.DefaultUserRole,
                    SystemEmail = config.SystemEmail,
                    Version = config.Version,
                    LastUpdated = config.LastUpdated,
                    UpdatedBy = config.UpdatedBy
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system configuration");
                throw;
            }
        }

        public async Task UpdateConfigurationAsync(SystemConfigurationDto configDto)
        {
            try
            {
                _logger.LogInformation("Updating system configuration");

                var config = await _context.SystemConfigurations.FirstOrDefaultAsync();
                
                if (config == null)
                {
                    config = new SystemConfiguration();
                    _context.SystemConfigurations.Add(config);
                }

                config.MaintenanceMode = configDto.MaintenanceMode;
                config.UserRegistration = configDto.UserRegistration;
                config.DebugMode = configDto.DebugMode;
                config.DefaultUserRole = configDto.DefaultUserRole;
                config.SystemEmail = configDto.SystemEmail;
                config.LastUpdated = DateTime.UtcNow;
                config.UpdatedBy = configDto.UpdatedBy ?? "System";

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("System configuration updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating system configuration");
                throw;
            }
        }

        public async Task<bool> IsMaintenanceModeActiveAsync()
        {
            try
            {
                var config = await _context.SystemConfigurations.FirstOrDefaultAsync();
                return config?.MaintenanceMode ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking maintenance mode");
                return false; // Hata durumunda, bakım modunu kapalı sayarız
            }
        }

        public async Task<bool> IsUserRegistrationEnabledAsync()
        {
            try
            {
                var config = await _context.SystemConfigurations.FirstOrDefaultAsync();
                return config?.UserRegistration ?? true; // Varsayılan olarak kayıt açık
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking user registration status");
                return true; // Hata durumunda, kayıt açık sayarız
            }
        }
    }
} 