using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Interfaces
{
    public interface IEmailLogService : IBaseService<EmailLog, EmailLogDto, CreateEmailLogDto, UpdateEmailLogDto>
    {
        Task<IEnumerable<EmailLogDto>> GetEmailLogsAsync();
        Task<EmailLogDto> GetEmailLogByIdAsync(int id);
        Task<IEnumerable<EmailLogDto>> GetEmailLogsByCompanyIdAsync(int companyId);
        Task<EmailLogDto> CreateEmailLogAsync(CreateEmailLogDto dto);
        Task<EmailLogDto> UpdateEmailLogAsync(int id, UpdateEmailLogDto dto);
        Task DeleteEmailLogAsync(int id);
        Task<IEnumerable<EmailLogDto>> GetEmailLogsByCustomerIdAsync(int customerId);
        Task<EmailLog> CreateEmailLogAsync(EmailLog emailLog);
        Task<IEnumerable<EmailLog>> GetEmailLogsByIdAsync(int id);
    }
} 