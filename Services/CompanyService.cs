using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly TrackMateDbContext _context;

        public CompanyService(TrackMateDbContext context)
        {
            _context = context;
        }

        public async Task<CompanyDto> CreateCompanyAsync(CreateCompanyDto createCompanyDto)
        {
            var company = new Company
            {
                Name = createCompanyDto.Name,
                Phone = createCompanyDto.Phone,
                TaxId = createCompanyDto.TaxId,
                Address = createCompanyDto.Address,
                CreatedDate = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return await GetCompanyAsync(company.Id);
        }

        public async Task<CompanyDto?> GetCompanyAsync(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return null;

            return new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                Phone = company.Phone,
                TaxId = company.TaxId,
                Address = company.Address,
                CreatedDate = company.CreatedDate
            };
        }

        public async Task<IEnumerable<CompanyDto>> GetCompaniesAsync()
        {
            var companies = await _context.Companies.ToListAsync();

            return companies.Select(c => new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                Phone = c.Phone,
                TaxId = c.TaxId,
                Address = c.Address,
                CreatedDate = c.CreatedDate
            });
        }

        public async Task<IEnumerable<CompanyDto>> GetCompaniesByIdAsync(int companyId)
        {
            var companies = await _context.Companies
                .Where(c => c.Id == companyId)
                .ToListAsync();

            return companies.Select(c => new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                TaxId = c.TaxId,
                Address = c.Address,
                Phone = c.Phone,
                CreatedDate = c.CreatedDate
            });
        }

        public async Task<CompanyDto?> UpdateCompanyAsync(int id, UpdateCompanyDto updateCompanyDto)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return null;

            company.Name = updateCompanyDto.Name;
            company.Phone = updateCompanyDto.Phone;
            company.TaxId = updateCompanyDto.TaxId;
            company.Address = updateCompanyDto.Address;

            await _context.SaveChangesAsync();

            return await GetCompanyAsync(company.Id);
        }

        public async Task<bool> DeleteCompanyAsync(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null) return false;

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 