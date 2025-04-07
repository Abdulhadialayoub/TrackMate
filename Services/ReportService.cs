using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TrackMate.API.Data;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Services
{
    public class ReportService : IReportService
    {
        private readonly TrackMateDbContext _context;
        private readonly ILogger<ReportService> _logger;

        public ReportService(
            TrackMateDbContext context,
            ILogger<ReportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<SalesReportDto>> GetMonthlySalesReportAsync(int companyId, int year)
        {
            try
            {
                _logger.LogInformation("Generating monthly sales report for company {CompanyId} and year {Year}", companyId, year);

                var orders = await _context.Orders
                    .Where(o => o.CompanyId == companyId && o.OrderDate.Year == year)
                    .Include(o => o.OrderItems)
                    .ToListAsync();

                var monthlySales = new List<SalesReportDto>();

                for (int month = 1; month <= 12; month++)
                {
                    var ordersInMonth = orders.Where(o => o.OrderDate.Month == month).ToList();
                    
                    var totalSales = ordersInMonth.Sum(o => o.Total);
                    var itemCount = ordersInMonth.Sum(o => o.OrderItems.Count);
                    var orderCount = ordersInMonth.Count;

                    monthlySales.Add(new SalesReportDto
                    {
                        Year = year,
                        Month = month,
                        MonthName = new DateTime(year, month, 1).ToString("MMMM"),
                        TotalSales = totalSales,
                        OrderCount = orderCount,
                        ItemCount = itemCount
                    });
                }

                return monthlySales;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating monthly sales report");
                throw;
            }
        }

        public async Task<IEnumerable<ProductPerformanceDto>> GetTopSellingProductsAsync(int companyId, int count = 10)
        {
            try
            {
                _logger.LogInformation("Getting top {Count} selling products for company {CompanyId}", count, companyId);

                var topProducts = await _context.OrderItems
                    .Where(oi => oi.Order.CompanyId == companyId)
                    .GroupBy(oi => oi.ProductId)
                    .Select(g => new ProductPerformanceDto
                    {
                        ProductId = g.Key,
                        ProductName = g.First().Product.Name,
                        TotalQuantity = g.Sum(oi => oi.Quantity),
                        TotalRevenue = g.Sum(oi => oi.Total)
                    })
                    .OrderByDescending(p => p.TotalRevenue)
                    .Take(count)
                    .ToListAsync();

                return topProducts;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top selling products");
                throw;
            }
        }

        public async Task<IEnumerable<CustomerPerformanceDto>> GetTopCustomersAsync(int companyId, int count = 10)
        {
            try
            {
                _logger.LogInformation("Getting top {Count} customers for company {CompanyId}", count, companyId);

                var topCustomers = await _context.Orders
                    .Where(o => o.CompanyId == companyId)
                    .GroupBy(o => o.CustomerId)
                    .Select(g => new CustomerPerformanceDto
                    {
                        CustomerId = g.Key,
                        CustomerName = g.First().Customer.Name,
                        OrderCount = g.Count(),
                        TotalSpent = g.Sum(o => o.Total),
                        LastOrderDate = g.Max(o => o.OrderDate)
                    })
                    .OrderByDescending(c => c.TotalSpent)
                    .Take(count)
                    .ToListAsync();

                return topCustomers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top customers");
                throw;
            }
        }

        public async Task<SystemStatusDto> GetSystemStatusAsync()
        {
            try
            {
                _logger.LogInformation("Getting system status");

                var userCount = await _context.Users.CountAsync();
                var companyCount = await _context.Companies.CountAsync();
                var productCount = await _context.Products.CountAsync();
                var orderCount = await _context.Orders.CountAsync();
                var customerCount = await _context.Customers.CountAsync();
                
                var latestOrder = await _context.Orders
                    .OrderByDescending(o => o.OrderDate)
                    .FirstOrDefaultAsync();
                
                var latestUser = await _context.Users
                    .OrderByDescending(u => u.CreatedAt)
                    .FirstOrDefaultAsync();

                return new SystemStatusDto
                {
                    UserCount = userCount,
                    CompanyCount = companyCount,
                    ProductCount = productCount,
                    OrderCount = orderCount,
                    CustomerCount = customerCount,
                    LatestOrderDate = latestOrder?.OrderDate ?? DateTime.MinValue,
                    LatestUserRegistration = latestUser?.CreatedAt ?? DateTime.MinValue,
                    SystemVersion = "1.0.0",
                    StartupTime = AppDomain.CurrentDomain.BaseDirectory,
                    ServerTime = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system status");
                throw;
            }
        }
    }
} 