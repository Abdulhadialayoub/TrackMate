using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Services
{
    public class EmailLogService : IEmailLogService
    {
        private readonly TrackMateDbContext _context;

        public EmailLogService(TrackMateDbContext context)
        {
            _context = context;
        }

        public async Task<EmailLogDto> CreateEmailLogAsync(CreateEmailLogDto createEmailLogDto)
        {
            var emailLog = new EmailLog
            {
                CompanyId = createEmailLogDto.CompanyId,
                CustomerId = createEmailLogDto.CustomerId,
                Subject = createEmailLogDto.Subject,
                EmailContent = createEmailLogDto.EmailContent,
                RecipientEmail = createEmailLogDto.RecipientEmail,
                EmailType = createEmailLogDto.EmailType,
                RelatedEntityId = createEmailLogDto.RelatedEntityId,
                RelatedEntityType = createEmailLogDto.RelatedEntityType,
                SentDate = DateTime.UtcNow,
                Status = "Pending",
                SentBy = createEmailLogDto.SentBy,
                CreatedDate = DateTime.UtcNow
            };

            _context.EmailLogs.Add(emailLog);
            await _context.SaveChangesAsync();

            return await GetEmailLogAsync(emailLog.Id);
        }

        public async Task<EmailLogDto?> GetEmailLogAsync(int id)
        {
            var emailLog = await _context.EmailLogs
                .Include(e => e.Company)
                .Include(e => e.Customer)
                .Include(e => e.SentByUser)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (emailLog == null) return null;

            return new EmailLogDto
            {
                Id = emailLog.Id,
                CompanyId = emailLog.CompanyId,
                CompanyName = emailLog.Company?.Name ?? string.Empty,
                CustomerId = emailLog.CustomerId,
                CustomerName = emailLog.Customer?.Name ?? string.Empty,
                Subject = emailLog.Subject,
                EmailContent = emailLog.EmailContent,
                RecipientEmail = emailLog.RecipientEmail,
                EmailType = emailLog.EmailType,
                RelatedEntityId = emailLog.RelatedEntityId,
                RelatedEntityType = emailLog.RelatedEntityType,
                SentDate = emailLog.SentDate,
                Status = emailLog.Status,
                ErrorMessage = emailLog.ErrorMessage,
                SentBy = emailLog.SentBy,
                SentByUserName = emailLog.SentByUser?.UserName ?? string.Empty,
                CreatedDate = emailLog.CreatedDate
            };
        }

        public async Task<IEnumerable<EmailLogDto>> GetEmailLogsAsync()
        {
            var emailLogs = await _context.EmailLogs
                .Include(e => e.Company)
                .Include(e => e.Customer)
                .Include(e => e.SentByUser)
                .ToListAsync();

            return emailLogs.Select(e => new EmailLogDto
            {
                Id = e.Id,
                CompanyId = e.CompanyId,
                CompanyName = e.Company?.Name ?? string.Empty,
                CustomerId = e.CustomerId,
                CustomerName = e.Customer?.Name ?? string.Empty,
                Subject = e.Subject,
                EmailContent = e.EmailContent,
                RecipientEmail = e.RecipientEmail,
                EmailType = e.EmailType,
                RelatedEntityId = e.RelatedEntityId,
                RelatedEntityType = e.RelatedEntityType,
                SentDate = e.SentDate,
                Status = e.Status,
                ErrorMessage = e.ErrorMessage,
                SentBy = e.SentBy,
                SentByUserName = e.SentByUser?.UserName ?? string.Empty,
                CreatedDate = e.CreatedDate
            });
        }

        public async Task<EmailLogDto?> UpdateEmailLogAsync(int id, UpdateEmailLogDto updateEmailLogDto)
        {
            var emailLog = await _context.EmailLogs.FindAsync(id);
            if (emailLog == null) return null;

            emailLog.Status = updateEmailLogDto.Status;
            emailLog.ErrorMessage = updateEmailLogDto.ErrorMessage;

            await _context.SaveChangesAsync();

            return await GetEmailLogAsync(emailLog.Id);
        }

        public async Task<bool> DeleteEmailLogAsync(int id)
        {
            var emailLog = await _context.EmailLogs.FindAsync(id);
            if (emailLog == null) return false;

            _context.EmailLogs.Remove(emailLog);
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 