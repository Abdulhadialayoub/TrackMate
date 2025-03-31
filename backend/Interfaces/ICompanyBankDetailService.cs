using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface ICompanyBankDetailService
    {
        Task<CompanyBankDetailDto> CreateCompanyBankDetailAsync(CreateCompanyBankDetailDto createCompanyBankDetailDto);
        Task<CompanyBankDetailDto?> GetCompanyBankDetailAsync(int id);
        Task<IEnumerable<CompanyBankDetailDto>> GetCompanyBankDetailsAsync();
        Task<CompanyBankDetailDto?> UpdateCompanyBankDetailAsync(int id, UpdateCompanyBankDetailDto updateCompanyBankDetailDto);
        Task<bool> DeleteCompanyBankDetailAsync(int id);
    }
} 