using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IConfigurationService
    {
        Task<SystemConfigurationDto> GetConfigurationAsync();
        Task UpdateConfigurationAsync(SystemConfigurationDto configDto);
        Task<bool> IsMaintenanceModeActiveAsync();
        Task<bool> IsUserRegistrationEnabledAsync();
    }
} 