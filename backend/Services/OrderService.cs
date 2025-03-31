using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Services
{
    public class OrderService : IOrderService
    {
        private readonly TrackMateDbContext _context;

        public OrderService(TrackMateDbContext context)
        {
            _context = context;
        }

        public async Task<OrderDto> CreateOrderAsync(CreateOrderDto createOrderDto)
        {
            var order = new Order
            {
                OrderNumber = GenerateOrderNumber(),
                CustomerId = createOrderDto.CustomerId,
                CompanyId = createOrderDto.CompanyId,
                Status = "Pending",
                OrderDate = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Add order items
            foreach (var item in createOrderDto.OrderItems)
            {
                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice
                };

                _context.OrderItems.Add(orderItem);
            }

            await _context.SaveChangesAsync();

            // Calculate total amount
            order.TotalAmount = await _context.OrderItems
                .Where(oi => oi.OrderId == order.Id)
                .SumAsync(oi => oi.TotalPrice);

            await _context.SaveChangesAsync();

            return await GetOrderAsync(order.Id);
        }

        public async Task<OrderDto?> GetOrderAsync(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Company)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return null;

            return new OrderDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerId = order.CustomerId,
                CustomerName = order.Customer?.Name ?? string.Empty,
                CompanyId = order.CompanyId,
                CompanyName = order.Company?.Name ?? string.Empty,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                OrderDate = order.OrderDate,
                CreatedDate = order.CreatedDate,
                OrderItems = order.OrderItems.Select(oi => new OrderItemDto
                {
                    Id = oi.Id,
                    OrderId = oi.OrderId,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product?.Name ?? string.Empty,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice
                }).ToList()
            };
        }

        public async Task<IEnumerable<OrderDto>> GetOrdersAsync()
        {
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Company)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .ToListAsync();

            return orders.Select(o => new OrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerId = o.CustomerId,
                CustomerName = o.Customer?.Name ?? string.Empty,
                CompanyId = o.CompanyId,
                CompanyName = o.Company?.Name ?? string.Empty,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                OrderDate = o.OrderDate,
                CreatedDate = o.CreatedDate,
                OrderItems = o.OrderItems.Select(oi => new OrderItemDto
                {
                    Id = oi.Id,
                    OrderId = oi.OrderId,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product?.Name ?? string.Empty,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice
                }).ToList()
            });
        }

        public async Task<OrderDto?> UpdateOrderAsync(int id, UpdateOrderDto updateOrderDto)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return null;

            order.CustomerId = updateOrderDto.CustomerId;
            order.CompanyId = updateOrderDto.CompanyId;
            order.Status = updateOrderDto.Status;

            // Update order items
            _context.OrderItems.RemoveRange(order.OrderItems);

            foreach (var item in updateOrderDto.OrderItems)
            {
                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice
                };

                _context.OrderItems.Add(orderItem);
            }

            // Recalculate total amount
            order.TotalAmount = updateOrderDto.OrderItems.Sum(item => item.Quantity * item.UnitPrice);

            await _context.SaveChangesAsync();

            return await GetOrderAsync(order.Id);
        }

        public async Task<bool> DeleteOrderAsync(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return false;

            _context.OrderItems.RemoveRange(order.OrderItems);
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return true;
        }

        private string GenerateOrderNumber()
        {
            return $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8)}";
        }
    }
} 