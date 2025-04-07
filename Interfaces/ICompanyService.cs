using System.Threading.Tasks;
using System.Collections.Generic;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Interfaces
{
    public interface ICompanyService : IBaseService<Company, CompanyDto, CreateCompanyDto, UpdateCompanyDto>
    {
        Task<CompanyDto> UpdateStatusAsync(int id, string status);
        Task<IEnumerable<CompanyBankDetailDto>> GetBankDetailsAsync(int companyId);
        Task<CompanyBankDetailDto> AddBankDetailAsync(int companyId, CreateCompanyBankDetailDto bankDetailDto);
        Task<CompanyBankDetailDto> UpdateBankDetailAsync(int companyId, int bankDetailId, UpdateCompanyBankDetailDto bankDetailDto);
        Task<bool> DeleteBankDetailAsync(int companyId, int bankDetailId);
        
        // Profil sayfasından şirket bilgilerini güncelleme metodu
        Task<CompanyDto> UpdateCompanyProfileAsync(int companyId, UpdateCompanyDto companyDto);
    }
} 