using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Interfaces
{
    public interface IOrderService : IBaseService<Order, OrderDto, CreateOrderDto, UpdateOrderDto>
    {
        Task<IEnumerable<OrderDto>> GetByCustomerIdAsync(int customerId);
        Task<OrderDto> UpdateStatusAsync(int id, OrderStatus status);
        Task<OrderDto> AddOrderItemAsync(int orderId, CreateOrderItemDto orderItemDto);
        Task<OrderDto> RemoveOrderItemAsync(int orderId, int itemId);
        Task<OrderDto> UpdateOrderItemQuantityAsync(int orderId, int itemId, int quantity);
        Task<string> GenerateOrderNumberAsync(int companyId);
    }
} 