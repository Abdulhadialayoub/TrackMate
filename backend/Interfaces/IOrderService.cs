using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IOrderService
    {
        Task<OrderDto> CreateOrderAsync(CreateOrderDto createOrderDto);
        Task<OrderDto?> GetOrderAsync(int id);
        Task<IEnumerable<OrderDto>> GetOrdersAsync();
        Task<OrderDto?> UpdateOrderAsync(int id, UpdateOrderDto updateOrderDto);
        Task<bool> DeleteOrderAsync(int id);
    }
} 