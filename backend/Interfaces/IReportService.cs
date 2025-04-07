using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IReportService
    {
        Task<IEnumerable<SalesReportDto>> GetMonthlySalesReportAsync(int companyId, int year);
        Task<IEnumerable<ProductPerformanceDto>> GetTopSellingProductsAsync(int companyId, int count = 10);
        Task<IEnumerable<CustomerPerformanceDto>> GetTopCustomersAsync(int companyId, int count = 10);
        Task<SystemStatusDto> GetSystemStatusAsync();
    }
} 