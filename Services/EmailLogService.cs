using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TrackMate.API.Services
{
    public class EmailLogService : BaseService<EmailLog, EmailLogDto, CreateEmailLogDto, UpdateEmailLogDto>, IEmailLogService
    {
        private readonly new TrackMateDbContext _context;
        private readonly new ILogger<EmailLogService> _logger;
        private readonly new IMapper _mapper;

        public EmailLogService(TrackMateDbContext context, IMapper mapper, ILogger<EmailLogService> logger)
            : base(context, mapper, logger)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        protected override async Task<EmailLog> GetEntityByIdAsync(int id)
        {
            return await _dbSet
                .Include(el => el.Company)
                .Include(el => el.Customer)
                .FirstOrDefaultAsync(el => el.Id == id && !el.IsDeleted);
        }

        public async Task<IEnumerable<EmailLogDto>> GetEmailLogsAsync()
        {
            return await GetAllAsync();
        }

        public async Task<EmailLogDto> GetEmailLogByIdAsync(int id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<IEnumerable<EmailLogDto>> GetEmailLogsByCompanyIdAsync(int companyId)
        {
            return await GetByCompanyIdAsync(companyId);
        }

        public async Task<EmailLogDto> CreateEmailLogAsync(CreateEmailLogDto dto)
        {
            // Validate company exists
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            // Validate customer exists if provided
            if (dto.CustomerId.HasValue)
            {
                var customer = await _context.Customers.FindAsync(dto.CustomerId.Value);
                if (customer == null)
                    throw new ApiException("Customer not found", 404, "CUSTOMER_NOT_FOUND");
            }

            return await CreateAsync(dto);
        }

        public async Task<EmailLogDto> UpdateEmailLogAsync(int id, UpdateEmailLogDto dto)
        {
            var existingEmailLog = await GetEntityByIdAsync(id);
            if (existingEmailLog == null)
                throw new ApiException("Email log not found", 404, "EMAIL_LOG_NOT_FOUND");

            // Validate customer exists if provided
            if (dto.CustomerId.HasValue)
            {
                var customer = await _context.Customers.FindAsync(dto.CustomerId.Value);
                if (customer == null)
                    throw new ApiException("Customer not found", 404, "CUSTOMER_NOT_FOUND");
            }

            return await UpdateAsync(id, dto);
        }

        public async Task DeleteEmailLogAsync(int id)
        {
            await DeleteAsync(id);
        }

        public async Task<IEnumerable<EmailLogDto>> GetEmailLogsByCustomerIdAsync(int customerId)
        {
            var emailLogs = await _dbSet
                .Include(el => el.Company)
                .Include(el => el.Customer)
                .Where(el => el.CustomerId == customerId && !el.IsDeleted)
                .OrderByDescending(el => el.CreatedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<EmailLogDto>>(emailLogs);
        }

        public override async Task<IEnumerable<EmailLogDto>> GetByCompanyIdAsync(int companyId)
        {
            try
            {
                _logger.LogInformation("Fetching email logs for company: {CompanyId}", companyId);

                var emailLogs = await _dbSet
                    .Include(e => e.Company)
                    .Include(e => e.Customer)
                    .Include(e => e.SentByUser)
                    .Where(e => e.CompanyId == companyId && !e.IsDeleted)
                    .OrderByDescending(e => e.SentDate)
                    .ToListAsync();

                return _mapper.Map<IEnumerable<EmailLogDto>>(emailLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching email logs for company: {CompanyId}", companyId);
                throw;
            }
        }

        public async Task<EmailLog> CreateEmailLogAsync(EmailLog emailLog)
        {
            _context.EmailLogs.Add(emailLog);
            await _context.SaveChangesAsync();
            return emailLog;
        }

        public async Task<IEnumerable<EmailLog>> GetEmailLogsByIdAsync(int id)
        {
            return await _dbSet
                .Where(e => e.Id == id && !e.IsDeleted)
                .ToListAsync();
        }
    }
} 