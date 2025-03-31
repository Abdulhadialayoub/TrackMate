using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IEmailLogService
    {
        Task<EmailLogDto> CreateEmailLogAsync(CreateEmailLogDto createEmailLogDto);
        Task<EmailLogDto?> GetEmailLogAsync(int id);
        Task<IEnumerable<EmailLogDto>> GetEmailLogsAsync();
        Task<EmailLogDto?> UpdateEmailLogAsync(int id, UpdateEmailLogDto updateEmailLogDto);
        Task<bool> DeleteEmailLogAsync(int id);
    }
} 