using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface ICustomerService
    {
        Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto createCustomerDto);
        Task<CustomerDto?> GetCustomerAsync(int id);
        Task<IEnumerable<CustomerDto>> GetCustomersAsync();
        Task<CustomerDto?> UpdateCustomerAsync(int id, UpdateCustomerDto updateCustomerDto);
        Task<bool> DeleteCustomerAsync(int id);
    }
} 