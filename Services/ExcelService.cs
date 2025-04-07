using ClosedXML.Excel;
using System.Data;
using System.IO;
using System.Threading.Tasks;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System;
using TrackMate.API.Models.Entities;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace TrackMate.API.Services
{
    public class ExcelService : IExcelService
    {
        private readonly TrackMateDbContext _context;
        private readonly ILogger<ExcelService> _logger;

        public ExcelService(TrackMateDbContext context, ILogger<ExcelService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<byte[]> GenerateProductsExcelAsync(int companyId)
        {
            try
            {
                _logger.LogInformation($"Generating products Excel report for company ID: {companyId}");
                
                // Fetch products for the company
                var products = await _context.Products
                    .Include(p => p.Category)
                    .Where(p => p.CompanyId == companyId && !p.IsDeleted)
                    .ToListAsync();

                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Products");

                // Define headers
                worksheet.Cell(1, 1).Value = "Product ID";
                worksheet.Cell(1, 2).Value = "Name";
                worksheet.Cell(1, 3).Value = "Description";
                worksheet.Cell(1, 4).Value = "Code";
                worksheet.Cell(1, 5).Value = "Unit Price";
                worksheet.Cell(1, 6).Value = "Unit";
                worksheet.Cell(1, 7).Value = "Stock Quantity";
                worksheet.Cell(1, 8).Value = "Category";
                worksheet.Cell(1, 9).Value = "Created At";
                worksheet.Cell(1, 10).Value = "Created By";

                // Style the header
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

                // Add data rows
                var productsArray = products.ToArray(); // Listeyi diziye çevir
                for (int i = 0; i < productsArray.Length; i++)
                {
                    var product = productsArray[i];
                    int row = i + 2;

                    worksheet.Cell(row, 1).Value = product.Id;
                    worksheet.Cell(row, 2).Value = product.Name;
                    worksheet.Cell(row, 3).Value = product.Description;
                    worksheet.Cell(row, 4).Value = product.Code;
                    worksheet.Cell(row, 5).Value = product.UnitPrice;
                    worksheet.Cell(row, 6).Value = product.Unit;
                    worksheet.Cell(row, 7).Value = product.StockQuantity;
                    worksheet.Cell(row, 8).Value = product.Category?.Name ?? "Uncategorized";
                    worksheet.Cell(row, 9).Value = product.CreatedAt.ToString("yyyy-MM-dd HH:mm");
                    worksheet.Cell(row, 10).Value = product.CreatedBy;
                }

                // Auto-fit columns
                worksheet.Columns().AdjustToContents();

                // Add a title with company info
                var company = await _context.Companies.FindAsync(companyId);
                if (company != null)
                {
                    worksheet.Range("A1:J1").InsertRowsAbove(2);
                    var titleCell = worksheet.Cell("A1");
                    titleCell.Value = $"Products Report - {company.Name}";
                    titleCell.Style.Font.Bold = true;
                    titleCell.Style.Font.FontSize = 16;
                    worksheet.Cell("A2").Value = $"Generated on: {DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}";
                }

                // Generate the Excel file as byte array
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating products Excel report for company ID: {companyId}");
                throw;
            }
        }

        public async Task<byte[]> GenerateOrdersExcelAsync(int companyId, DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                _logger.LogInformation($"Generating orders Excel report for company ID: {companyId} from {startDate} to {endDate}");
                
                // Default date range if not provided
                startDate ??= DateTime.Today.AddMonths(-1);
                endDate ??= DateTime.Today.AddDays(1);

                // Fetch orders for the company in the date range
                var orders = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(i => i.Product)
                    .Where(o => o.CompanyId == companyId 
                             && !o.IsDeleted
                             && o.OrderDate >= startDate
                             && o.OrderDate <= endDate)
                    .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();

                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Orders");

                // Define headers
                worksheet.Cell(1, 1).Value = "Order ID";
                worksheet.Cell(1, 2).Value = "Order Number";
                worksheet.Cell(1, 3).Value = "Customer";
                worksheet.Cell(1, 4).Value = "Order Date";
                worksheet.Cell(1, 5).Value = "Due Date";
                worksheet.Cell(1, 6).Value = "Status";
                worksheet.Cell(1, 7).Value = "Items Count";
                worksheet.Cell(1, 8).Value = "Sub Total";
                worksheet.Cell(1, 9).Value = "Tax Amount";
                worksheet.Cell(1, 10).Value = "Total Amount";
                worksheet.Cell(1, 11).Value = "Created By";
                worksheet.Cell(1, 12).Value = "Notes";

                // Style the header
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

                // Add data rows
                var ordersArray = orders.ToArray(); // Listeyi diziye çevir
                for (int i = 0; i < ordersArray.Length; i++)
                {
                    var order = ordersArray[i];
                    int row = i + 2;

                    worksheet.Cell(row, 1).Value = order.Id;
                    worksheet.Cell(row, 2).Value = order.OrderNumber;
                    worksheet.Cell(row, 3).Value = order.Customer?.Name ?? "Unknown";
                    worksheet.Cell(row, 4).Value = order.OrderDate.ToString("yyyy-MM-dd");
                    worksheet.Cell(row, 5).Value = order.DueDate.ToString("yyyy-MM-dd");
                    worksheet.Cell(row, 6).Value = order.Status.ToString();
                    int itemCount = order.OrderItems?.Count ?? 0;
                    worksheet.Cell(row, 7).Value = itemCount;
                    worksheet.Cell(row, 8).Value = order.SubTotal;
                    worksheet.Cell(row, 9).Value = order.TaxAmount;
                    worksheet.Cell(row, 10).Value = order.Total;
                    worksheet.Cell(row, 11).Value = order.CreatedBy;
                    worksheet.Cell(row, 12).Value = order.Notes;
                }

                // Auto-fit columns
                worksheet.Columns().AdjustToContents();

                // Add a title with company info
                var company = await _context.Companies.FindAsync(companyId);
                if (company != null)
                {
                    worksheet.Range("A1:L1").InsertRowsAbove(3);
                    var titleCell = worksheet.Cell("A1");
                    titleCell.Value = $"Orders Report - {company.Name}";
                    titleCell.Style.Font.Bold = true;
                    titleCell.Style.Font.FontSize = 16;
                    worksheet.Cell("A2").Value = $"Period: {startDate?.ToString("yyyy-MM-dd")} to {endDate?.ToString("yyyy-MM-dd")}";
                    worksheet.Cell("A3").Value = $"Generated on: {DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}";
                }

                // Generate the Excel file as byte array
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating orders Excel report for company ID: {companyId}");
                throw;
            }
        }

        public async Task<byte[]> GenerateCustomersExcelAsync(int companyId)
        {
            try
            {
                _logger.LogInformation($"Generating customers Excel report for company ID: {companyId}");
                
                // Fetch customers for the company
                var customers = await _context.Customers
                    .Where(c => c.CompanyId == companyId && !c.IsDeleted)
                    .ToListAsync();

                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Customers");

                // Define headers
                worksheet.Cell(1, 1).Value = "Customer ID";
                worksheet.Cell(1, 2).Value = "Name";
                worksheet.Cell(1, 3).Value = "Email";
                worksheet.Cell(1, 4).Value = "Phone";
                worksheet.Cell(1, 5).Value = "Address";
                worksheet.Cell(1, 6).Value = "Tax Number";
                worksheet.Cell(1, 7).Value = "Status";
                worksheet.Cell(1, 8).Value = "Created At";
                worksheet.Cell(1, 9).Value = "Notes";

                // Style the header
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

                // Add data rows
                var customersArray = customers.ToArray(); // Listeyi diziye çevir
                for (int i = 0; i < customersArray.Length; i++)
                {
                    var customer = customersArray[i];
                    int row = i + 2;

                    worksheet.Cell(row, 1).Value = customer.Id;
                    worksheet.Cell(row, 2).Value = customer.Name;
                    worksheet.Cell(row, 3).Value = customer.Email;
                    worksheet.Cell(row, 4).Value = customer.Phone;
                    worksheet.Cell(row, 5).Value = customer.Address;
                    worksheet.Cell(row, 6).Value = customer.TaxNumber;
                    worksheet.Cell(row, 7).Value = customer.Status.ToString();
                    worksheet.Cell(row, 8).Value = customer.CreatedAt.ToString("yyyy-MM-dd");
                    worksheet.Cell(row, 9).Value = customer.Notes;
                }

                // Auto-fit columns
                worksheet.Columns().AdjustToContents();

                // Add a title with company info
                var company = await _context.Companies.FindAsync(companyId);
                if (company != null)
                {
                    worksheet.Range("A1:I1").InsertRowsAbove(2);
                    var titleCell = worksheet.Cell("A1");
                    titleCell.Value = $"Customers Report - {company.Name}";
                    titleCell.Style.Font.Bold = true;
                    titleCell.Style.Font.FontSize = 16;
                    worksheet.Cell("A2").Value = $"Generated on: {DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")}";
                }

                // Generate the Excel file as byte array
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating customers Excel report for company ID: {companyId}");
                throw;
            }
        }
    }
} 