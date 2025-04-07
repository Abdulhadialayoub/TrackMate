using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TrackMate.API.Services
{
    public class OrderService : BaseService<Order, OrderDto, CreateOrderDto, UpdateOrderDto>, IOrderService
    {
        public OrderService(TrackMateDbContext context, IMapper mapper, ILogger<OrderService> logger)
            : base(context, mapper, logger)
        {
        }

        public override async Task<OrderDto> GetByIdAsync(int id)
        {
            try
            {
                _logger.LogInformation("Fetching order: {Id}", id);

                var order = await _dbSet
                    .Include(o => o.Company)
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);

                if (order == null)
                {
                    throw new ApiException("Order not found", 404, "ORDER_NOT_FOUND");
                }

                return _mapper.Map<OrderDto>(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching order: {Id}", id);
                throw;
            }
        }

        public override async Task<IEnumerable<OrderDto>> GetByCompanyIdAsync(int companyId)
        {
            try
            {
                _logger.LogInformation("Fetching orders for company: {CompanyId}", companyId);

                var orders = await _dbSet
                    .Include(o => o.Company)
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .Where(o => o.CompanyId == companyId && !o.IsDeleted)
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();

                return _mapper.Map<IEnumerable<OrderDto>>(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching orders for company: {CompanyId}", companyId);
                throw;
            }
        }

        public override async Task<OrderDto> CreateAsync(CreateOrderDto dto)
        {
            try
            {
                _logger.LogInformation("Creating new order for company: {CompanyId}", dto.CompanyId);

                var company = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Id == dto.CompanyId && !c.IsDeleted);

                if (company == null)
                {
                    throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");
                }

                var customer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == dto.CustomerId && c.CompanyId == dto.CompanyId && !c.IsDeleted);

                if (customer == null)
                {
                    throw new ApiException("Customer not found", 404, "CUSTOMER_NOT_FOUND");
                }

                var orderNumber = await GenerateOrderNumberAsync(dto.CompanyId);
                decimal subTotal = CalculateSubTotal(dto.Items);
                decimal taxAmount = 0;
                decimal total = CalculateTotal(subTotal, taxAmount, 0);

                var order = _mapper.Map<Order>(dto);
                order.OrderNumber = orderNumber;
                order.SubTotal = subTotal;
                order.TaxAmount = taxAmount;
                order.Total = total;
                order.Status = "Draft";
                order.CreatedAt = DateTime.UtcNow;

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                if (dto.Items?.Any() == true)
                {
                    var orderItems = new List<OrderItem>();
                    foreach (var item in dto.Items)
                    {
                        var product = await _context.Products
                            .FirstOrDefaultAsync(p => p.Id == item.ProductId && p.CompanyId == dto.CompanyId && !p.IsDeleted);

                        if (product == null)
                        {
                            throw new ApiException($"Product not found: {item.ProductId}", 404, "PRODUCT_NOT_FOUND");
                        }

                        var orderItem = new OrderItem
                        {
                            OrderId = order.Id,
                            ProductId = item.ProductId,
                            Quantity = (int)item.Quantity,
                            UnitPrice = item.UnitPrice,
                            Total = item.Quantity * item.UnitPrice,
                            CreatedAt = DateTime.UtcNow
                        };

                        orderItems.Add(orderItem);
                    }

                    _context.OrderItems.AddRange(orderItems);
                    await _context.SaveChangesAsync();
                }

                return await GetByIdAsync(order.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order for company: {CompanyId}", dto.CompanyId);
                throw;
            }
        }

        public async Task<string> GenerateOrderNumberAsync(int companyId)
        {
            var lastOrder = await _dbSet
                .Where(o => o.CompanyId == companyId && !o.IsDeleted)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastOrder != null)
            {
                var parts = lastOrder.OrderNumber.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"ORD-{companyId:D4}-{nextNumber:D6}";
        }

        private decimal CalculateSubTotal(IEnumerable<CreateOrderItemDto> items)
        {
            if (items == null || !items.Any())
                return 0;

            return items.Sum(item => item.Quantity * item.UnitPrice);
        }

        private decimal CalculateTaxAmount(decimal subTotal, decimal taxRate)
        {
            return subTotal * (taxRate / 100);
        }

        private decimal CalculateTotal(decimal subTotal, decimal taxAmount, decimal shippingCost)
        {
            return subTotal + taxAmount + shippingCost;
        }

        public async Task<IEnumerable<OrderDto>> GetByCustomerIdAsync(int customerId)
        {
            try
            {
                _logger.LogInformation("Fetching orders for customer: {CustomerId}", customerId);

                var orders = await _dbSet
                    .Include(o => o.Company)
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .Where(o => o.CustomerId == customerId && !o.IsDeleted)
                    .OrderByDescending(o => o.CreatedAt)
                    .ToListAsync();

                return _mapper.Map<IEnumerable<OrderDto>>(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching orders for customer: {CustomerId}", customerId);
                throw;
            }
        }

        public async Task<OrderDto> UpdateStatusAsync(int id, OrderStatus status)
        {
            try
            {
                _logger.LogInformation("Updating order status: {Id}, Status: {Status}", id, status);

                var order = await _dbSet
                    .Include(o => o.Company)
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);

                if (order == null)
                {
                    throw new ApiException("Order not found", 404, "ORDER_NOT_FOUND");
                }

                order.Status = status.ToString();
                order.UpdatedAt = DateTime.UtcNow;

                _dbSet.Update(order);
                await _context.SaveChangesAsync();

                return _mapper.Map<OrderDto>(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order status: {Id}", id);
                throw;
            }
        }

        public async Task<OrderDto> AddOrderItemAsync(int orderId, CreateOrderItemDto orderItemDto)
        {
            try
            {
                _logger.LogInformation("Adding item to order: {OrderId}", orderId);

                var order = await _dbSet
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);

                if (order == null)
                {
                    throw new ApiException("Order not found", 404, "ORDER_NOT_FOUND");
                }

                var product = await _context.Products
                    .FirstOrDefaultAsync(p => p.Id == orderItemDto.ProductId && !p.IsDeleted);

                if (product == null)
                {
                    throw new ApiException("Product not found", 404, "PRODUCT_NOT_FOUND");
                }

                var orderItem = new OrderItem
                {
                    OrderId = orderId,
                    ProductId = orderItemDto.ProductId,
                    Quantity = (int)orderItemDto.Quantity,
                    UnitPrice = orderItemDto.UnitPrice,
                    Total = orderItemDto.Quantity * orderItemDto.UnitPrice,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = orderItemDto.CreatedBy
                };

                _context.OrderItems.Add(orderItem);
                await _context.SaveChangesAsync();

                // Recalculate order totals
                await RecalculateOrderTotalsAsync(order);

                return await GetByIdAsync(orderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item to order: {OrderId}", orderId);
                throw;
            }
        }

        public async Task<OrderDto> RemoveOrderItemAsync(int orderId, int itemId)
        {
            try
            {
                _logger.LogInformation("Removing item from order: {OrderId}, ItemId: {ItemId}", orderId, itemId);

                var order = await _dbSet
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);

                if (order == null)
                {
                    throw new ApiException("Order not found", 404, "ORDER_NOT_FOUND");
                }

                var orderItem = await _context.OrderItems
                    .FirstOrDefaultAsync(oi => oi.Id == itemId && oi.OrderId == orderId);

                if (orderItem == null)
                {
                    throw new ApiException("Order item not found", 404, "ORDER_ITEM_NOT_FOUND");
                }

                _context.OrderItems.Remove(orderItem);
                await _context.SaveChangesAsync();

                // Recalculate order totals
                await RecalculateOrderTotalsAsync(order);

                return await GetByIdAsync(orderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing item from order: {OrderId}, ItemId: {ItemId}", orderId, itemId);
                throw;
            }
        }

        public async Task<OrderDto> UpdateOrderItemQuantityAsync(int orderId, int itemId, int quantity)
        {
            try
            {
                _logger.LogInformation("Updating item quantity: {OrderId}, ItemId: {ItemId}, Quantity: {Quantity}", orderId, itemId, quantity);

                var order = await _dbSet
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);

                if (order == null)
                {
                    throw new ApiException("Order not found", 404, "ORDER_NOT_FOUND");
                }

                var orderItem = await _context.OrderItems
                    .FirstOrDefaultAsync(oi => oi.Id == itemId && oi.OrderId == orderId);

                if (orderItem == null)
                {
                    throw new ApiException("Order item not found", 404, "ORDER_ITEM_NOT_FOUND");
                }

                orderItem.Quantity = quantity;
                orderItem.Total = quantity * orderItem.UnitPrice;
                orderItem.UpdatedAt = DateTime.UtcNow;

                _context.OrderItems.Update(orderItem);
                await _context.SaveChangesAsync();

                // Recalculate order totals
                await RecalculateOrderTotalsAsync(order);

                return await GetByIdAsync(orderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating item quantity: {OrderId}, ItemId: {ItemId}", orderId, itemId);
                throw;
            }
        }

        private async Task RecalculateOrderTotalsAsync(Order order)
        {
            await _context.Entry(order)
                .Collection(o => o.OrderItems)
                .LoadAsync();

            order.SubTotal = order.OrderItems.Sum(oi => oi.Total);
            order.Total = order.SubTotal + order.TaxAmount;
            order.UpdatedAt = DateTime.UtcNow;

            _dbSet.Update(order);
            await _context.SaveChangesAsync();
        }
    }
} 