using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;
using TrackMate.API.Exceptions;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : BaseController
    {
        private readonly IUserService _userService;
        private readonly IOrderService _orderService;
        private readonly IProductService _productService;
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(
            IUserService userService,
            IOrderService orderService,
            IProductService productService,
            IInvoiceService invoiceService,
            ILogger<DashboardController> logger)
        {
            _userService = userService;
            _orderService = orderService;
            _productService = productService;
            _invoiceService = invoiceService;
            _logger = logger;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            try
            {
                _logger.LogInformation("Fetching dashboard statistics");
                
                // Get the company ID for the current user
                int companyId = GetCompanyId();
                _logger.LogInformation($"Fetching stats for company ID: {companyId}");
                
                // Get count of users for this company
                var users = await _userService.GetByCompanyIdAsync(companyId);
                int userCount = users != null ? users.Count() : 0;
                _logger.LogInformation($"User count: {userCount}");
                
                // Get active orders for this company
                var orders = await _orderService.GetByCompanyIdAsync(companyId);
                int activeOrderCount = 0;
                
                if (orders != null)
                {
                    // Status can be int or string based on the implementation
                    activeOrderCount = orders.Count(o => 
                        o.Status.ToString() == "1" || 
                        o.Status.ToString() == "2" || 
                        o.Status.ToString() == "3" ||
                        o.Status.ToString() == "Pending" ||
                        o.Status.ToString() == "Confirmed" ||
                        o.Status.ToString() == "Shipped");
                }
                _logger.LogInformation($"Active order count: {activeOrderCount}");
                
                // Get total revenue for this company from paid invoices
                var invoices = await _invoiceService.GetByCompanyIdAsync(companyId);
                decimal revenue = 0;
                
                if (invoices != null)
                {
                    // Status can be int or string based on the implementation
                    revenue = invoices
                        .Where(i => 
                            i.Status.ToString() == "2" || 
                            i.Status.ToString() == "Paid")
                        .Sum(i => i.Total);
                }
                _logger.LogInformation($"Total revenue: {revenue}");
                
                // Get count of products for this company
                var products = await _productService.GetByCompanyIdAsync(companyId);
                int productCount = products != null ? products.Count() : 0;
                _logger.LogInformation($"Product count: {productCount}");
                
                var stats = new
                {
                    UserCount = userCount,
                    ActiveOrderCount = activeOrderCount,
                    Revenue = revenue,
                    ProductCount = productCount
                };
                
                _logger.LogInformation("Returning dashboard statistics");
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching dashboard statistics");
                return StatusCode(500, new { message = "Error fetching dashboard statistics", error = ex.Message });
            }
        }

        [HttpGet("recent-orders")]
        public async Task<ActionResult<IEnumerable<object>>> GetRecentOrders([FromQuery] int limit = 5)
        {
            try
            {
                _logger.LogInformation($"Fetching {limit} recent orders");
                
                // Get the company ID for the current user
                int companyId = GetCompanyId();
                _logger.LogInformation($"Fetching recent orders for company ID: {companyId}");
                
                // Get orders for this company
                var orders = await _orderService.GetByCompanyIdAsync(companyId);
                
                if (orders == null)
                {
                    _logger.LogWarning("No orders found for this company");
                    return Ok(new List<object>());
                }
                
                // Get most recent orders
                var recentOrders = orders
                    .OrderByDescending(o => o.OrderDate)
                    .Take(limit)
                    .Select(o => new {
                        o.Id,
                        o.OrderNumber,
                        CustomerName = o.CustomerName ?? "Unknown Customer", 
                        OrderDate = o.OrderDate,
                        DueDate = o.DueDate,
                        Status = o.Status,
                        // Use strongly typed access to property
                        Total = o.SubTotal + o.TaxAmount + o.ShippingCost,
                        Currency = string.IsNullOrEmpty(o.Currency) ? "USD" : o.Currency
                    })
                    .ToList();
                
                _logger.LogInformation($"Returning {recentOrders.Count} recent orders");
                return Ok(recentOrders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching recent orders");
                return StatusCode(500, new { message = "Error fetching recent orders", error = ex.Message });
            }
        }

        [HttpGet("top-products")]
        public async Task<ActionResult<IEnumerable<object>>> GetTopProducts([FromQuery] int limit = 5)
        {
            try
            {
                _logger.LogInformation($"Fetching {limit} top products");
                
                // Get the company ID for the current user
                int companyId = GetCompanyId();
                _logger.LogInformation($"Fetching top products for company ID: {companyId}");
                
                // Get all products for this company first
                var products = await _productService.GetByCompanyIdAsync(companyId);
                
                if (products == null || !products.Any())
                {
                    _logger.LogWarning("No products found for this company");
                    return Ok(new List<object>());
                }
                
                // Return top products just based on product list if we can't calculate by sales
                var topProducts = products
                    .Take(limit)
                    .Select(p => new
                    {
                        ProductId = p.Id,
                        ProductName = p.Name,
                        UnitPrice = p.UnitPrice, // Use UnitPrice instead of Price
                        Stock = p.Quantity // Use Quantity instead of QuantityInStock
                    })
                    .ToList<object>();
                
                _logger.LogInformation($"Returning {topProducts.Count} products");
                return Ok(topProducts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching top products");
                return StatusCode(500, new { message = "Error fetching top products", error = ex.Message });
            }
        }
    }
} 