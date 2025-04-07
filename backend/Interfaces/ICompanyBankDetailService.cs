using System.Threading.Tasks;
using System.Collections.Generic;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Interfaces
{
    public interface ICompanyBankDetailService : IBaseService<CompanyBankDetail, CompanyBankDetailDto, CreateCompanyBankDetailDto, UpdateCompanyBankDetailDto>
    {
        new Task<IEnumerable<CompanyBankDetailDto>> GetByCompanyIdAsync(int companyId);
        Task<CompanyBankDetailDto> GetByCompanyIdAndBankDetailIdAsync(int companyId, int bankDetailId);
        Task<CompanyBankDetailDto> GetCompanyBankDetailByIdAsync(int id);
        Task<CompanyBankDetailDto[]> GetCompanyBankDetailsByCompanyIdAsync(int companyId);
        Task<CompanyBankDetailDto> CreateCompanyBankDetailAsync(CreateCompanyBankDetailDto dto);
        Task<CompanyBankDetailDto> UpdateCompanyBankDetailAsync(int id, UpdateCompanyBankDetailDto dto);
        Task DeleteCompanyBankDetailAsync(int id);
    }
} 