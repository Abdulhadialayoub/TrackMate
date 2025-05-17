using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Data;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EmailController : BaseController
    {
        private readonly IEmailService _emailService;
        private readonly IEmailLogService _emailLogService;
        private readonly ILogger<EmailController> _logger;
        private readonly TrackMateDbContext _context;

        public EmailController(
            IEmailService emailService,
            IEmailLogService emailLogService,
            ILogger<EmailController> logger,
            TrackMateDbContext context)
        {
            _emailService = emailService;
            _emailLogService = emailLogService;
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Send an email
        /// </summary>
        [HttpPost("send")]
        public async Task<IActionResult> SendEmail([FromBody] SendEmailDto request)
        {
            try
            {
                // Check if the user has access to the company
                if (!await ValidateCompanyAccess(request.CompanyId))
                {
                    return Forbid();
                }

                bool result = await _emailService.SendEmailAsync(
                    request.To,
                    request.Subject,
                    request.Body,
                    request.CompanyId,
                    request.CustomerId);

                if (result)
                {
                    return Ok(new ResponseDto<bool>
                    {
                        Success = true,
                        Message = "Email sent successfully",
                        Data = true
                    });
                }
                else
                {
                    return StatusCode(500, new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Failed to send email",
                        Data = false
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email");
                return StatusCode(500, new ResponseDto<bool>
                {
                    Success = false,
                    Message = "An error occurred while sending the email",
                    Errors = new List<string> { ex.Message },
                    Data = false
                });
            }
        }

        /// <summary>
        /// Send order confirmation email
        /// </summary>
        [HttpPost("order/{orderId}/confirmation")]
        public async Task<IActionResult> SendOrderConfirmation(int orderId)
        {
            try
            {
                // Get the order's CompanyId first
                var order = await _context.Orders.FindAsync(orderId);
                if (order == null)
                {
                    return NotFound(new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Order not found",
                        Data = false
                    });
                }

                // Validate company access
                if (!await ValidateCompanyAccess(order.CompanyId))
                {
                    return Forbid();
                }

                bool result = await _emailService.SendOrderConfirmationAsync(orderId);

                if (result)
                {
                    return Ok(new ResponseDto<bool>
                    {
                        Success = true,
                        Message = "Order confirmation email sent successfully",
                        Data = true
                    });
                }
                else
                {
                    return StatusCode(500, new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Failed to send order confirmation email",
                        Data = false
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending order confirmation email for order ID: {orderId}");
                return StatusCode(500, new ResponseDto<bool>
                {
                    Success = false,
                    Message = "An error occurred while sending the order confirmation email",
                    Errors = new List<string> { ex.Message },
                    Data = false
                });
            }
        }

        /// <summary>
        /// Send invoice email
        /// </summary>
        [HttpPost("invoice/{invoiceId}")]
        public async Task<IActionResult> SendInvoice(int invoiceId)
        {
            try
            {
                // Get the invoice's CompanyId first
                var invoice = await _context.Invoices.FindAsync(invoiceId);
                if (invoice == null)
                {
                    return NotFound(new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Invoice not found",
                        Data = false
                    });
                }

                // Validate company access
                if (!await ValidateCompanyAccess(invoice.CompanyId))
                {
                    return Forbid();
                }

                bool result = await _emailService.SendInvoiceAsync(invoiceId);

                if (result)
                {
                    return Ok(new ResponseDto<bool>
                    {
                        Success = true,
                        Message = "Invoice email sent successfully",
                        Data = true
                    });
                }
                else
                {
                    return StatusCode(500, new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Failed to send invoice email",
                        Data = false
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending invoice email for invoice ID: {invoiceId}");
                return StatusCode(500, new ResponseDto<bool>
                {
                    Success = false,
                    Message = "An error occurred while sending the invoice email",
                    Errors = new List<string> { ex.Message },
                    Data = false
                });
            }
        }

        /// <summary>
        /// Send invoice email with custom message
        /// </summary>
        [HttpPost("send-invoice")]
        public async Task<IActionResult> SendInvoiceWithCustomMessage([FromBody] SendInvoiceEmailDto request)
        {
            try
            {
                // Check if the user has access to the company
                if (!await ValidateCompanyAccess(request.CompanyId))
                {
                    return Forbid();
                }

                // Get the invoice to validate it exists
                var invoice = await _context.Invoices
                    .Include(i => i.Customer)
                    .FirstOrDefaultAsync(i => i.Id == request.InvoiceId);
                    
                if (invoice == null)
                {
                    return NotFound(new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Invoice not found",
                        Data = false
                    });
                }
                
                // Make sure invoice belongs to the requested company
                if (invoice.CompanyId != request.CompanyId)
                {
                    return BadRequest(new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Invoice does not belong to the specified company",
                        Data = false
                    });
                }
                
                bool result = await _emailService.SendCustomInvoiceEmailAsync(
                    request.InvoiceId,
                    request.To,
                    request.Subject,
                    request.Body,
                    request.IncludeAttachment);

                if (result)
                {
                    // Update invoice status to "Sent" if it was in "Draft"
                    if (invoice.Status == InvoiceStatus.Draft.ToString()) // Draft status
                    {
                        invoice.Status = InvoiceStatus.Sent.ToString(); // Sent status
                        
                        // Get username safely or use a default value
                        string username = User?.Identity?.Name ?? "System";
                        invoice.UpdatedBy = username;
                        
                        invoice.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                    
                    return Ok(new ResponseDto<bool>
                    {
                        Success = true,
                        Message = "Invoice email sent successfully",
                        Data = true
                    });
                }
                else
                {
                    return StatusCode(500, new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Failed to send invoice email",
                        Data = false
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending custom invoice email");
                return StatusCode(500, new ResponseDto<bool>
                {
                    Success = false,
                    Message = "An error occurred while sending the invoice email",
                    Errors = new List<string> { ex.Message },
                    Data = false
                });
            }
        }

        /// <summary>
        /// Get all email logs for a company
        /// </summary>
        [HttpGet("logs")]
        public async Task<IActionResult> GetEmailLogs()
        {
            try
            {
                // Get the company ID from the token
                var companyId = GetCompanyId();

                var emailLogs = await _emailLogService.GetEmailLogsByCompanyIdAsync(companyId);

                return Ok(new ResponseDto<IEnumerable<EmailLogDto>>
                {
                    Success = true,
                    Message = "Email logs retrieved successfully",
                    Data = emailLogs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving email logs");
                return StatusCode(500, new ResponseDto<IEnumerable<EmailLogDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving email logs",
                    Errors = new List<string> { ex.Message },
                    Data = new List<EmailLogDto>()
                });
            }
        }

        /// <summary>
        /// Get all email logs for a customer
        /// </summary>
        [HttpGet("logs/customer/{customerId}")]
        public async Task<IActionResult> GetEmailLogsByCustomer(int customerId)
        {
            try
            {
                // Get the company ID from the token
                var companyId = GetCompanyId();

                // Validate company access (in case customer belongs to a different company)
                var customer = await _context.Customers.FindAsync(customerId);
                if (customer == null)
                {
                    return NotFound(new ResponseDto<IEnumerable<EmailLogDto>>
                    {
                        Success = false,
                        Message = "Customer not found",
                        Data = new List<EmailLogDto>()
                    });
                }

                if (!await ValidateCompanyAccess(customer.CompanyId))
                {
                    return Forbid();
                }

                var emailLogs = await _emailLogService.GetEmailLogsByCustomerIdAsync(customerId);

                return Ok(new ResponseDto<IEnumerable<EmailLogDto>>
                {
                    Success = true,
                    Message = "Email logs retrieved successfully",
                    Data = emailLogs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving email logs for customer ID: {customerId}");
                return StatusCode(500, new ResponseDto<IEnumerable<EmailLogDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving customer email logs",
                    Errors = new List<string> { ex.Message },
                    Data = new List<EmailLogDto>()
                });
            }
        }
    }

    public class SendEmailDto
    {
        public string To { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public int CompanyId { get; set; }
        public int? CustomerId { get; set; }
    }

    public class SendInvoiceEmailDto
    {
        public int InvoiceId { get; set; }
        public string To { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public bool IncludeAttachment { get; set; }
        public int CompanyId { get; set; }
    }
} 