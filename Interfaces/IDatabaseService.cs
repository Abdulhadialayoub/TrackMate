using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IDatabaseService
    {
        Task<string> BackupDatabaseAsync();
        Task RestoreDatabaseAsync(string backupFilePath);
        Task ResetDatabaseAsync();
        Task<DatabaseStatusDto> GetDatabaseStatusAsync();
    }
} 