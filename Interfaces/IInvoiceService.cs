using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Interfaces
{
    public interface IInvoiceService : IBaseService<Invoice, InvoiceDto, CreateInvoiceDto, UpdateInvoiceDto>
    {
        Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto dto);
        Task<InvoiceDto> UpdateInvoiceAsync(int id, UpdateInvoiceDto dto);
        Task DeleteInvoiceAsync(int id);
        Task<IEnumerable<InvoiceDto>> GetByCustomerIdAsync(int customerId);
        Task<InvoiceDto> GetByOrderIdAsync(int orderId);
        Task<InvoiceDto> UpdateStatusAsync(int id, UpdateInvoiceStatusDto statusDto);
        Task<InvoiceDto> AddInvoiceItemAsync(int invoiceId, CreateInvoiceItemDto invoiceItemDto);
        Task<InvoiceDto> RemoveInvoiceItemAsync(int invoiceId, int itemId);
        Task<string> GenerateInvoiceNumberAsync(int companyId);
        
        // PDF related methods
        Task<byte[]> GenerateInvoicePdfAsync(int invoiceId);
        Task<string> SaveInvoicePdfAsync(int invoiceId);
        Task<InvoiceDto> SavePdfToDatabaseAsync(int invoiceId, bool saveToDatabase = true, bool saveToFileSystem = true);
    }
} 