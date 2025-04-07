using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Services
{
    public class CompanyService : BaseService<Company, CompanyDto, CreateCompanyDto, UpdateCompanyDto>, ICompanyService
    {
        public CompanyService(TrackMateDbContext context, IMapper mapper, ILogger<CompanyService> logger)
            : base(context, mapper, logger)
        {
        }

        protected override async Task<Company> GetEntityByIdAsync(int id)
        {
            return await _dbSet
                .Include(c => c.BankDetails)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        }

        public async Task<IEnumerable<CompanyDto>> GetCompaniesAsync()
        {
            return await GetAllAsync();
        }

        public async Task<CompanyDto> GetCompanyByIdAsync(int id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<CompanyDto> CreateCompanyAsync(CreateCompanyDto dto)
        {
            // Validate tax number uniqueness
            if (await _dbSet.AnyAsync(c => c.TaxNumber == dto.TaxNumber && !c.IsDeleted))
                throw new ApiException("Company with this tax number already exists", 400, "DUPLICATE_TAX_NUMBER");

            return await CreateAsync(dto);
        }

        public async Task<CompanyDto> UpdateCompanyAsync(int id, UpdateCompanyDto dto)
        {
            var existingCompany = await GetEntityByIdAsync(id);
            if (existingCompany == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            // Validate tax number uniqueness
            if (await _dbSet.AnyAsync(c => c.TaxNumber == dto.TaxNumber && c.Id != id && !c.IsDeleted))
                throw new ApiException("Company with this tax number already exists", 400, "DUPLICATE_TAX_NUMBER");

            return await UpdateAsync(id, dto);
        }

        public async Task<CompanyDto> UpdateCompanyProfileAsync(int companyId, UpdateCompanyDto companyDto)
        {
            var company = await GetEntityByIdAsync(companyId);
            if (company == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            // Validate tax number uniqueness if it's being changed
            if (company.TaxNumber != companyDto.TaxNumber && 
                await _dbSet.AnyAsync(c => c.TaxNumber == companyDto.TaxNumber && c.Id != companyId && !c.IsDeleted))
            {
                throw new ApiException("Company with this tax number already exists", 400, "DUPLICATE_TAX_NUMBER");
            }

            // Update company information
            _mapper.Map(companyDto, company);
            company.UpdatedAt = DateTime.UtcNow;

            _context.Companies.Update(company);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Company profile updated: {companyId}");
            return _mapper.Map<CompanyDto>(company);
        }

        public async Task DeleteCompanyAsync(int id)
        {
            // Check if company has any customers
            var hasCustomers = await _context.Customers.AnyAsync(c => c.CompanyId == id && !c.IsDeleted);
            if (hasCustomers)
                throw new ApiException("Cannot delete company with existing customers", 400, "COMPANY_HAS_CUSTOMERS");

            // Check if company has any products
            var hasProducts = await _context.Products.AnyAsync(p => p.CompanyId == id && !p.IsDeleted);
            if (hasProducts)
                throw new ApiException("Cannot delete company with existing products", 400, "COMPANY_HAS_PRODUCTS");

            // Check if company has any orders
            var hasOrders = await _context.Orders.AnyAsync(o => o.CompanyId == id && !o.IsDeleted);
            if (hasOrders)
                throw new ApiException("Cannot delete company with existing orders", 400, "COMPANY_HAS_ORDERS");

            // Check if company has any invoices
            var hasInvoices = await _context.Invoices.AnyAsync(i => i.CompanyId == id && !i.IsDeleted);
            if (hasInvoices)
                throw new ApiException("Cannot delete company with existing invoices", 400, "COMPANY_HAS_INVOICES");

            await DeleteAsync(id);
        }

        public async Task<CompanyDto> GetCompanyByTaxNumberAsync(string taxNumber)
        {
            var company = await _dbSet
                .Include(c => c.BankDetails)
                .FirstOrDefaultAsync(c => c.TaxNumber == taxNumber && !c.IsDeleted);

            if (company == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            return _mapper.Map<CompanyDto>(company);
        }

        public async Task<IEnumerable<CompanyBankDetailDto>> GetBankDetailsAsync(int companyId)
        {
            var bankDetails = await _context.CompanyBankDetails
                .Where(bd => bd.CompanyId == companyId && !bd.IsDeleted)
                .ToListAsync();

            return _mapper.Map<IEnumerable<CompanyBankDetailDto>>(bankDetails);
        }

        public async Task<CompanyBankDetailDto> AddBankDetailAsync(int companyId, CreateCompanyBankDetailDto bankDetailDto)
        {
            var company = await _dbSet.FindAsync(companyId);
            if (company == null || company.IsDeleted)
                return null;

            var bankDetail = _mapper.Map<CompanyBankDetail>(bankDetailDto);
            bankDetail.CompanyId = companyId;
            bankDetail.CreatedAt = DateTime.UtcNow;
            bankDetail.IsActive = true;

            await _context.CompanyBankDetails.AddAsync(bankDetail);
            await _context.SaveChangesAsync();

            return _mapper.Map<CompanyBankDetailDto>(bankDetail);
        }

        public async Task<CompanyBankDetailDto> UpdateBankDetailAsync(int companyId, int bankDetailId, UpdateCompanyBankDetailDto bankDetailDto)
        {
            var bankDetail = await _context.CompanyBankDetails
                .FirstOrDefaultAsync(bd => bd.Id == bankDetailId && bd.CompanyId == companyId && !bd.IsDeleted);

            if (bankDetail == null)
                return null;

            _mapper.Map(bankDetailDto, bankDetail);
            bankDetail.UpdatedAt = DateTime.UtcNow;

            _context.CompanyBankDetails.Update(bankDetail);
            await _context.SaveChangesAsync();

            return _mapper.Map<CompanyBankDetailDto>(bankDetail);
        }

        public async Task<bool> DeleteBankDetailAsync(int companyId, int bankDetailId)
        {
            var bankDetail = await _context.CompanyBankDetails
                .FirstOrDefaultAsync(bd => bd.Id == bankDetailId && bd.CompanyId == companyId);

            if (bankDetail == null)
                return false;

            bankDetail.IsDeleted = true;
            bankDetail.UpdatedAt = DateTime.UtcNow;

            _context.CompanyBankDetails.Update(bankDetail);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<CompanyDto> UpdateStatusAsync(int id, string status)
        {
            var company = await GetEntityByIdAsync(id);
            if (company == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            company.IsActive = status == "Active";
            company.UpdatedAt = DateTime.UtcNow;

            _context.Companies.Update(company);
            await _context.SaveChangesAsync();

            return _mapper.Map<CompanyDto>(company);
        }
    }
} 