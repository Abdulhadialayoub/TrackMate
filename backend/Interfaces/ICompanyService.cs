using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface ICompanyService
    {
        Task<CompanyDto> CreateCompanyAsync(CreateCompanyDto createCompanyDto);
        Task<CompanyDto?> GetCompanyAsync(int id);
        Task<IEnumerable<CompanyDto>> GetCompaniesAsync();
        Task<CompanyDto?> UpdateCompanyAsync(int id, UpdateCompanyDto updateCompanyDto);
        Task<bool> DeleteCompanyAsync(int id);
    }
} 