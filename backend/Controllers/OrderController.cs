using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;
using TrackMate.API.Exceptions;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using TrackMate.API.Data;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : BaseController
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrderController> _logger;
        private readonly TrackMateDbContext _context;

        public OrderController(
            IOrderService orderService,
            ILogger<OrderController> logger,
            TrackMateDbContext context)
        {
            _orderService = orderService;
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll()
        {
            var result = await ExecuteAsync(async () => await _orderService.GetAllAsync());
            return await SanitizeOrdersResponseAsync(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetById(int id)
        {
            var result = await ExecuteAsync(async () => await _orderService.GetByIdAsync(id));
            
            if (result is OkObjectResult okResult && okResult.Value is OrderDto orderDto)
            {
                // Sanitize single order
                var sanitizedOrder = await SanitizeOrderDtoAsync(orderDto);
                return Ok(sanitizedOrder);
            }
            
            return result;
        }

        [HttpGet("company/{companyId}")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetByCompanyId(int companyId)
        {
            try
            {
                _logger.LogInformation("Fetching orders for company ID: {CompanyId}", companyId);
                
                // Get the orders from the service
                var orders = await _orderService.GetByCompanyIdAsync(companyId);
                
                // Log order count before sanitization
                _logger.LogInformation("Retrieved {Count} orders from service before sanitization", orders.Count());
                
                // Sanitize the orders asynchronously
                var sanitizedOrders = new List<OrderDto>();
                foreach (var order in orders)
                {
                    var sanitizedOrder = await SanitizeOrderDtoAsync(order);
                    sanitizedOrders.Add(sanitizedOrder);
                }
                
                // Log order count after sanitization
                _logger.LogInformation("Returning {Count} sanitized orders", sanitizedOrders.Count());
                
                // Check if any orders were potentially lost during sanitization
                if (sanitizedOrders.Count() < orders.Count())
                {
                    _logger.LogWarning("Some orders were lost during sanitization: before={Before}, after={After}", 
                        orders.Count(), sanitizedOrders.Count());
                }
                
                return Ok(sanitizedOrders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching orders for company: {CompanyId}", companyId);
                return StatusCode(500, new { message = "Failed to fetch orders", error = ex.Message });
            }
        }

        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetByCustomerId(int customerId)
        {
            try
            {
                // First check if the customer exists
                var customer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == customerId && !c.IsDeleted);
                
                if (customer == null)
                {
                    return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
                }

                // Get all orders for this customer
                var orders = await _orderService.GetByCustomerIdAsync(customerId);
                
                // Log order count before sanitization
                _logger.LogInformation("Retrieved {Count} orders for customer {CustomerId} before sanitization", 
                    orders.Count(), customerId);
                
                // Sanitize the orders asynchronously but with known customer info
                var sanitizedOrders = new List<OrderDto>();
                foreach (var order in orders)
                {
                    // Ensure the order has the correct customer info since we already have it
                    if (order.Customer == null || order.Customer.Name == "Unknown Customer")
                    {
                        order.Customer = new CustomerDto 
                        { 
                            Id = customer.Id,
                            Name = customer.Name,
                            Email = customer.Email,
                            Phone = customer.Phone,
                            CompanyId = customer.CompanyId
                        };
                    }
                    
                    var sanitizedOrder = await SanitizeOrderDtoAsync(order);
                    sanitizedOrders.Add(sanitizedOrder);
                }
                
                // Log order count after sanitization
                _logger.LogInformation("Returning {Count} sanitized orders for customer {CustomerId}", 
                    sanitizedOrders.Count(), customerId);
                
                return Ok(sanitizedOrders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders for customer {CustomerId}", customerId);
                return StatusCode(500, new { message = "Failed to get customer orders", error = ex.Message });
            }
        }

        // Helper method to sanitize orders response
        private async Task<ActionResult> SanitizeOrdersResponseAsync(ActionResult result)
        {
            if (result is OkObjectResult okResult)
            {
                if (okResult.Value is IEnumerable<OrderDto> orders)
                {
                    // Sanitize each order in the collection asynchronously
                    var sanitizedOrders = new List<OrderDto>();
                    foreach (var order in orders)
                    {
                        var sanitizedOrder = await SanitizeOrderDtoAsync(order);
                        sanitizedOrders.Add(sanitizedOrder);
                    }
                    return Ok(sanitizedOrders);
                }
            }
            
            return result;
        }
        
        // Helper method to sanitize a single OrderDto
        private async Task<OrderDto> SanitizeOrderDtoAsync(OrderDto order)
        {
            if (order == null) return null;
            
            // Ensure status is valid
            if (order.Status == default)
            {
                order.Status = Models.Enums.OrderStatus.Draft;
                _logger.LogWarning("Order {OrderId} had null status, defaulting to Draft", order.Id);
            }
            
            // Ensure dates are valid
            if (order.OrderDate == default)
            {
                order.OrderDate = DateTime.UtcNow;
                _logger.LogWarning("Order {OrderId} had null OrderDate, defaulting to current date", order.Id);
            }
            
            if (order.DueDate == default)
            {
                order.DueDate = DateTime.UtcNow.AddDays(30);
                _logger.LogWarning("Order {OrderId} had null DueDate, defaulting to 30 days from now", order.Id);
            }
            
            // Ensure customer data exists - try to fetch from database if needed
            if (order.Customer == null || string.IsNullOrEmpty(order.Customer.Name))
            {
                try
                {
                    // Attempt to get the actual customer from database
                    var customer = await _context.Customers
                        .AsNoTracking()
                        .FirstOrDefaultAsync(c => c.Id == order.CustomerId && !c.IsDeleted);
                    
                    if (customer != null)
                    {
                        // We found the actual customer, use it
                        order.Customer = new CustomerDto 
                        { 
                            Id = customer.Id,
                            Name = customer.Name,
                            Email = customer.Email,
                            Phone = customer.Phone,
                            CompanyId = customer.CompanyId
                        };
                        _logger.LogInformation("Order {OrderId}: Found customer {CustomerName} (ID: {CustomerId}) from database", 
                            order.Id, customer.Name, customer.Id);
                    }
                    else if (order.Customer == null)
                    {
                        // If we couldn't find the customer in DB and there's no customer object, create a placeholder
                        order.Customer = new CustomerDto 
                        { 
                            Name = "Unknown Customer",
                            Id = order.CustomerId
                        };
                        _logger.LogWarning("Order {OrderId}: Customer ID {CustomerId} not found in database, created placeholder", 
                            order.Id, order.CustomerId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error looking up customer for order {OrderId}", order.Id);
                    // In case of error, make sure we still have a customer object
                    if (order.Customer == null)
                    {
                        order.Customer = new CustomerDto 
                        { 
                            Name = "Unknown Customer",
                            Id = order.CustomerId
                        };
                    }
                }
            }
            
            // Ensure currency is set
            if (string.IsNullOrEmpty(order.Currency))
            {
                order.Currency = "USD";
                _logger.LogWarning("Order {OrderId} had no currency, defaulting to USD", order.Id);
            }
            
            return order;
        }
        
        // Helper method to sanitize a single OrderDto (sync version)
        private OrderDto SanitizeOrderDto(OrderDto order)
        {
            if (order == null) return null;
            
            // Ensure status is valid
            if (order.Status == default)
            {
                order.Status = Models.Enums.OrderStatus.Draft;
                _logger.LogWarning("Order {OrderId} had null status, defaulting to Draft", order.Id);
            }
            
            // Ensure dates are valid
            if (order.OrderDate == default)
            {
                order.OrderDate = DateTime.UtcNow;
                _logger.LogWarning("Order {OrderId} had null OrderDate, defaulting to current date", order.Id);
            }
            
            if (order.DueDate == default)
            {
                order.DueDate = DateTime.UtcNow.AddDays(30);
                _logger.LogWarning("Order {OrderId} had null DueDate, defaulting to 30 days from now", order.Id);
            }
            
            // Ensure customer data exists - CustomerName is a computed property from Customer.Name
            if (order.Customer == null)
            {
                // Create a minimal customer if needed
                order.Customer = new CustomerDto 
                { 
                    Name = "Unknown Customer",
                    Id = order.CustomerId
                };
                _logger.LogWarning("Order {OrderId} had no customer, created placeholder", order.Id);
            }
            
            // Ensure currency is set
            if (string.IsNullOrEmpty(order.Currency))
            {
                order.Currency = "USD";
                _logger.LogWarning("Order {OrderId} had no currency, defaulting to USD", order.Id);
            }
            
            return order;
        }

        [HttpPost]
        public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderDto orderDto)
        {
            try
            {
                _logger.LogInformation("Creating new order for customer: {CustomerId}", orderDto.CustomerId);
                
                // Validate the customer ID first
                var customer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.Id == orderDto.CustomerId && !c.IsDeleted);
                
                if (customer == null)
                {
                    _logger.LogWarning("Customer with ID {CustomerId} not found", orderDto.CustomerId);
                    return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
                }
                
                // Validate the company ID
                var company = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Id == orderDto.CompanyId && !c.IsDeleted);
                
                if (company == null)
                {
                    _logger.LogWarning("Company with ID {CompanyId} not found", orderDto.CompanyId);
                    return NotFound(new { message = "Company not found", code = "COMPANY_NOT_FOUND" });
                }
                
                // Log the customer name for reference
                _logger.LogInformation("Processing order for customer: {CustomerName} (ID: {CustomerId})", 
                    customer.Name, orderDto.CustomerId);
                
                var result = await ExecuteAsync(
                    async () => await _orderService.CreateAsync(orderDto)
                );
                
                if (result is OkObjectResult okResult && okResult.Value is OrderDto createdOrder)
                {
                    // The CustomerName is a computed property on OrderDto based on Customer.Name
                    // We need to ensure the Customer object is set properly
                    if (createdOrder.Customer == null)
                    {
                        // Create a Customer object with the data we have
                        createdOrder.Customer = new CustomerDto
                        {
                            Id = customer.Id,
                            Name = customer.Name,
                            Email = customer.Email,
                            Phone = customer.Phone,
                            CompanyId = customer.CompanyId
                        };
                    }
                    
                    // Ensure customerId is properly set
                    if (createdOrder.CustomerId <= 0)
                    {
                        createdOrder.CustomerId = orderDto.CustomerId;
                    }
                    
                    // Log the order creation success with ID
                    _logger.LogInformation("Order created successfully with ID: {OrderId}", createdOrder.Id);
                    
                    // Return a sanitized order with all necessary information
                    var sanitizedOrder = await SanitizeOrderDtoAsync(createdOrder);
                    return Ok(sanitizedOrder);
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, new { message = "An error occurred while creating the order", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<OrderDto>> Update(int id, [FromBody] UpdateOrderDto updateOrderDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.UpdateAsync(id, updateOrderDto)
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.DeleteAsync(id)
            );
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<OrderDto>> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.UpdateStatusAsync(id, statusDto.Status)
            );
        }

        [HttpPost("{id}/items")]
        public async Task<ActionResult<OrderDto>> AddOrderItem(int id, [FromBody] CreateOrderItemDto orderItemDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.AddOrderItemAsync(id, orderItemDto)
            );
        }

        [HttpDelete("{id}/items/{itemId}")]
        public async Task<ActionResult<OrderDto>> RemoveOrderItem(int id, int itemId)
        {
            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.RemoveOrderItemAsync(id, itemId)
            );
        }
    }
} 