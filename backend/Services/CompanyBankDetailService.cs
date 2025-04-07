using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using AutoMapper;

namespace TrackMate.API.Services
{
    public class CompanyBankDetailService : BaseService<CompanyBankDetail, CompanyBankDetailDto, CreateCompanyBankDetailDto, UpdateCompanyBankDetailDto>, ICompanyBankDetailService
    {
        public CompanyBankDetailService(
            TrackMateDbContext context,
            IMapper mapper,
            ILogger<CompanyBankDetailService> logger) : base(context, mapper, logger)
        {
        }

        protected override async Task<CompanyBankDetail> GetEntityByIdAsync(int id)
        {
            return await _dbSet
                .Include(bd => bd.Company)
                .FirstOrDefaultAsync(bd => bd.Id == id && !bd.IsDeleted);
        }

        public new async Task<IEnumerable<CompanyBankDetailDto>> GetByCompanyIdAsync(int companyId)
        {
            return await base.GetByCompanyIdAsync(companyId);
        }

        public async Task<CompanyBankDetailDto> GetByCompanyIdAndBankDetailIdAsync(int companyId, int bankDetailId)
        {
            var bankDetail = await _dbSet
                .Include(bd => bd.Company)
                .FirstOrDefaultAsync(bd => bd.CompanyId == companyId && bd.Id == bankDetailId && !bd.IsDeleted);

            if (bankDetail == null)
                return null;

            return _mapper.Map<CompanyBankDetailDto>(bankDetail);
        }

        public async Task<CompanyBankDetailDto> GetCompanyBankDetailByIdAsync(int id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<CompanyBankDetailDto[]> GetCompanyBankDetailsByCompanyIdAsync(int companyId)
        {
            var bankDetails = await _dbSet
                .Include(bd => bd.Company)
                .Where(bd => bd.CompanyId == companyId && !bd.IsDeleted)
                .ToArrayAsync();

            return _mapper.Map<CompanyBankDetailDto[]>(bankDetails);
        }

        public async Task<CompanyBankDetailDto> CreateCompanyBankDetailAsync(CreateCompanyBankDetailDto dto)
        {
            // Validate company exists
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            // Validate IBAN uniqueness within company
            if (await _dbSet.AnyAsync(bd => bd.CompanyId == dto.CompanyId && bd.IBAN == dto.IBAN && !bd.IsDeleted))
                throw new ApiException("Bank detail with this IBAN already exists", 400, "DUPLICATE_IBAN");

            return await CreateAsync(dto);
        }

        public async Task<CompanyBankDetailDto> UpdateCompanyBankDetailAsync(int id, UpdateCompanyBankDetailDto dto)
        {
            var existingBankDetail = await GetEntityByIdAsync(id);
            if (existingBankDetail == null)
                throw new ApiException("Bank detail not found", 404, "BANK_DETAIL_NOT_FOUND");

            // Validate IBAN uniqueness within company
            if (await _dbSet.AnyAsync(bd => bd.CompanyId == existingBankDetail.CompanyId && bd.IBAN == dto.IBAN && bd.Id != id && !bd.IsDeleted))
                throw new ApiException("Bank detail with this IBAN already exists", 400, "DUPLICATE_IBAN");

            return await UpdateAsync(id, dto);
        }

        public async Task DeleteCompanyBankDetailAsync(int id)
        {
            // Check if bank detail is used in any invoices
            var hasInvoices = await _context.Invoices.AnyAsync(i => i.BankDetailsId == id && !i.IsDeleted);
            if (hasInvoices)
                throw new ApiException("Cannot delete bank detail that is used in invoices", 400, "BANK_DETAIL_IN_USE");

            await DeleteAsync(id);
        }
    }
} 