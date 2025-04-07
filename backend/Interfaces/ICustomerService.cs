using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Interfaces
{
    public interface ICustomerService : IBaseService<Customer, CustomerDto, CreateCustomerDto, UpdateCustomerDto>
    {
        Task<CustomerDto> UpdateStatusAsync(int id, CustomerStatus status);
        Task<IEnumerable<OrderDto>> GetCustomerOrdersAsync(int customerId);
        Task<IEnumerable<InvoiceDto>> GetCustomerInvoicesAsync(int customerId);
        new Task<IEnumerable<CustomerDto>> GetByCompanyIdAsync(int companyId);
        new Task<CustomerDto> GetByIdAsync(int id);
        Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto);
        Task<CustomerDto> UpdateCustomerAsync(int id, UpdateCustomerDto dto);
        Task DeleteCustomerAsync(int id);
    }
} 