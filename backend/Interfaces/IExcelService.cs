using System;
using System.Threading.Tasks;

namespace TrackMate.API.Interfaces
{
    public interface IExcelService
    {
        Task<byte[]> GenerateProductsExcelAsync(int companyId);
        Task<byte[]> GenerateOrdersExcelAsync(int companyId, DateTime? startDate = null, DateTime? endDate = null);
        Task<byte[]> GenerateCustomersExcelAsync(int companyId);
    }
} 