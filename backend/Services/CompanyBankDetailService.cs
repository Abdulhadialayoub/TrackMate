using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Services
{
    public class CompanyBankDetailService : ICompanyBankDetailService
    {
        private readonly TrackMateDbContext _context;

        public CompanyBankDetailService(TrackMateDbContext context)
        {
            _context = context;
        }

        public async Task<CompanyBankDetailDto> CreateCompanyBankDetailAsync(CreateCompanyBankDetailDto createCompanyBankDetailDto)
        {
            var bankDetail = new CompanyBankDetail
            {
                CompanyId = createCompanyBankDetailDto.CompanyId,
                BankName = createCompanyBankDetailDto.BankName,
                AccountName = createCompanyBankDetailDto.AccountName,
                IBAN = createCompanyBankDetailDto.IBAN,
                SWIFT = createCompanyBankDetailDto.SWIFT,
                Currency = createCompanyBankDetailDto.Currency,
                CreatedDate = DateTime.UtcNow
            };

            _context.CompanyBankDetails.Add(bankDetail);
            await _context.SaveChangesAsync();

            return await GetCompanyBankDetailAsync(bankDetail.Id);
        }

        public async Task<CompanyBankDetailDto?> GetCompanyBankDetailAsync(int id)
        {
            var bankDetail = await _context.CompanyBankDetails
                .Include(b => b.Company)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bankDetail == null) return null;

            return new CompanyBankDetailDto
            {
                Id = bankDetail.Id,
                CompanyId = bankDetail.CompanyId,
                CompanyName = bankDetail.Company?.Name ?? string.Empty,
                BankName = bankDetail.BankName,
                AccountName = bankDetail.AccountName,
                IBAN = bankDetail.IBAN,
                SWIFT = bankDetail.SWIFT,
                Currency = bankDetail.Currency,
                CreatedDate = bankDetail.CreatedDate
            };
        }

        public async Task<IEnumerable<CompanyBankDetailDto>> GetCompanyBankDetailsAsync()
        {
            var bankDetails = await _context.CompanyBankDetails
                .Include(b => b.Company)
                .ToListAsync();

            return bankDetails.Select(b => new CompanyBankDetailDto
            {
                Id = b.Id,
                CompanyId = b.CompanyId,
                CompanyName = b.Company?.Name ?? string.Empty,
                BankName = b.BankName,
                AccountName = b.AccountName,
                IBAN = b.IBAN,
                SWIFT = b.SWIFT,
                Currency = b.Currency,
                CreatedDate = b.CreatedDate
            });
        }

        public async Task<CompanyBankDetailDto?> UpdateCompanyBankDetailAsync(int id, UpdateCompanyBankDetailDto updateCompanyBankDetailDto)
        {
            var bankDetail = await _context.CompanyBankDetails.FindAsync(id);
            if (bankDetail == null) return null;

            bankDetail.BankName = updateCompanyBankDetailDto.BankName;
            bankDetail.AccountName = updateCompanyBankDetailDto.AccountName;
            bankDetail.IBAN = updateCompanyBankDetailDto.IBAN;
            bankDetail.SWIFT = updateCompanyBankDetailDto.SWIFT;
            bankDetail.Currency = updateCompanyBankDetailDto.Currency;

            await _context.SaveChangesAsync();

            return await GetCompanyBankDetailAsync(bankDetail.Id);
        }

        public async Task<bool> DeleteCompanyBankDetailAsync(int id)
        {
            var bankDetail = await _context.CompanyBankDetails.FindAsync(id);
            if (bankDetail == null) return false;

            _context.CompanyBankDetails.Remove(bankDetail);
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 