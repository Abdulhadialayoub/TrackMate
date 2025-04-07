using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using TrackMate.API.Interfaces;
using Microsoft.Extensions.Logging;
using System.IO;
using TrackMate.API.Exceptions;

namespace TrackMate.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportController : BaseController
    {
        private readonly IExcelService _excelService;
        private readonly ILogger<ReportController> _logger;
        private readonly TrackMate.API.Data.TrackMateDbContext _context;

        public ReportController(
            IExcelService excelService,
            ILogger<ReportController> logger,
            TrackMate.API.Data.TrackMateDbContext context)
        {
            _excelService = excelService;
            _logger = logger;
            _context = context;
        }

        [HttpGet("excel/products")]
        public async Task<IActionResult> ExportProductsToExcel([FromQuery] int? companyId = null)
        {
            try
            {
                var userCompanyId = GetCompanyId();
                var targetCompanyId = companyId ?? userCompanyId;

                // Validate company access
                if (!await ValidateCompanyAccess(targetCompanyId))
                {
                    return Forbid();
                }

                var fileBytes = await _excelService.GenerateProductsExcelAsync(targetCompanyId);
                var company = await GetCompanyNameAsync(targetCompanyId);
                
                return File(
                    fileBytes, 
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    $"Products_{company}_{DateTime.Now:yyyyMMdd}.xlsx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting products to Excel");
                return StatusCode(500, new { message = "Error generating Excel report" });
            }
        }

        [HttpGet("excel/orders")]
        public async Task<IActionResult> ExportOrdersToExcel(
            [FromQuery] int? companyId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userCompanyId = GetCompanyId();
                var targetCompanyId = companyId ?? userCompanyId;

                // Validate company access
                if (!await ValidateCompanyAccess(targetCompanyId))
                {
                    return Forbid();
                }

                var fileBytes = await _excelService.GenerateOrdersExcelAsync(targetCompanyId, startDate, endDate);
                var company = await GetCompanyNameAsync(targetCompanyId);
                
                // Format dates for filename
                var startString = startDate?.ToString("yyyyMMdd") ?? "All";
                var endString = endDate?.ToString("yyyyMMdd") ?? "Today";
                
                return File(
                    fileBytes, 
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    $"Orders_{company}_{startString}_to_{endString}.xlsx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting orders to Excel");
                return StatusCode(500, new { message = "Error generating Excel report" });
            }
        }

        [HttpGet("excel/customers")]
        public async Task<IActionResult> ExportCustomersToExcel([FromQuery] int? companyId = null)
        {
            try
            {
                var userCompanyId = GetCompanyId();
                var targetCompanyId = companyId ?? userCompanyId;

                // Validate company access
                if (!await ValidateCompanyAccess(targetCompanyId))
                {
                    return Forbid();
                }

                var fileBytes = await _excelService.GenerateCustomersExcelAsync(targetCompanyId);
                var company = await GetCompanyNameAsync(targetCompanyId);
                
                return File(
                    fileBytes, 
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    $"Customers_{company}_{DateTime.Now:yyyyMMdd}.xlsx");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting customers to Excel");
                return StatusCode(500, new { message = "Error generating Excel report" });
            }
        }

        // Helper method to get company name
        private async Task<string> GetCompanyNameAsync(int companyId)
        {
            try
            {
                // Query the database to get company name based on ID
                var company = await _context.Companies.FindAsync(companyId);
                return company?.Name?.Replace(" ", "_") ?? "Company";
            }
            catch (Exception)
            {
                return "Company";
            }
        }
    }
} 