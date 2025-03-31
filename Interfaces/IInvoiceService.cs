using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IInvoiceService
    {
        Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto createInvoiceDto);
        Task<InvoiceDto?> GetInvoiceAsync(int id);
        Task<IEnumerable<InvoiceDto>> GetInvoicesAsync();
        Task<InvoiceDto?> UpdateInvoiceAsync(int id, UpdateInvoiceDto updateInvoiceDto);
        Task<bool> DeleteInvoiceAsync(int id);
    }
} 