using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Data;
using Microsoft.EntityFrameworkCore;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentController : BaseController
    {
        private readonly IDocumentService _documentService;
        private readonly ILogger<DocumentController> _logger;
        private readonly TrackMateDbContext _context;

        public DocumentController(
            IDocumentService documentService,
            ILogger<DocumentController> logger,
            TrackMateDbContext context)
        {
            _documentService = documentService;
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Generates an invoice PDF and returns it for download
        /// </summary>
        /// <param name="invoiceId">The ID of the invoice</param>
        /// <returns>The PDF file as a download</returns>
        [HttpGet("invoice/{invoiceId}/pdf")]
        public async Task<IActionResult> GenerateInvoicePdf(int invoiceId)
        {
            try
            {
                // Get the invoice and check company access
                var invoice = await _context.Invoices.FindAsync(invoiceId);
                if (invoice == null)
                {
                    return NotFound(new ResponseDto<bool>
                    {
                        Success = false,
                        Message = $"Invoice not found with ID: {invoiceId}",
                        Data = false
                    });
                }

                if (!await ValidateCompanyAccess(invoice.CompanyId))
                {
                    return Forbid();
                }

                // Generate the PDF
                var pdfBytes = await _documentService.GenerateInvoicePdfAsync(invoiceId);
                
                // Return the PDF as a file download
                return File(pdfBytes, "application/pdf", $"Invoice_{invoiceId}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating invoice PDF for invoice ID: {invoiceId}");
                return StatusCode(500, new ResponseDto<bool>
                {
                    Success = false,
                    Message = "An error occurred while generating the invoice PDF.",
                    Errors = new List<string> { ex.Message },
                    Data = false
                });
            }
        }

        /// <summary>
        /// Generates an order PDF and returns it for download
        /// </summary>
        /// <param name="orderId">The ID of the order</param>
        /// <returns>The PDF file as a download</returns>
        [HttpGet("order/{orderId}/pdf")]
        public async Task<IActionResult> GenerateOrderPdf(int orderId)
        {
            try
            {
                // Get the order and check company access
                var order = await _context.Orders.FindAsync(orderId);
                if (order == null)
                {
                    return NotFound(new ResponseDto<bool>
                    {
                        Success = false,
                        Message = $"Order not found with ID: {orderId}",
                        Data = false
                    });
                }

                if (!await ValidateCompanyAccess(order.CompanyId))
                {
                    return Forbid();
                }

                // Generate the PDF
                var pdfBytes = await _documentService.GenerateOrderPdfAsync(orderId);
                
                // Return the PDF as a file download
                return File(pdfBytes, "application/pdf", $"Order_{orderId}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating order PDF for order ID: {orderId}");
                return StatusCode(500, new ResponseDto<bool>
                {
                    Success = false,
                    Message = "An error occurred while generating the order PDF.",
                    Errors = new List<string> { ex.Message },
                    Data = false
                });
            }
        }

        /// <summary>
        /// Sends an invoice PDF as an email attachment
        /// </summary>
        /// <param name="invoiceId">The ID of the invoice</param>
        /// <returns>The result of the email sending operation</returns>
        [HttpPost("invoice/{invoiceId}/email")]
        public async Task<IActionResult> SendInvoiceEmail(int invoiceId)
        {
            try
            {
                // Get the invoice and check company access
                var invoice = await _context.Invoices.FindAsync(invoiceId);
                if (invoice == null)
                {
                    return NotFound(new ResponseDto<bool>
                    {
                        Success = false,
                        Message = $"Invoice not found with ID: {invoiceId}",
                        Data = false
                    });
                }

                if (!await ValidateCompanyAccess(invoice.CompanyId))
                {
                    return Forbid();
                }

                // Send the invoice email
                var result = await _documentService.SendInvoiceWithPdfAsync(invoiceId);
                
                if (result)
                {
                    return Ok(new ResponseDto<bool>
                    {
                        Success = true,
                        Message = "Invoice email sent successfully.",
                        Data = true
                    });
                }
                else
                {
                    return StatusCode(500, new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Failed to send the invoice email.",
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
                    Message = "An error occurred while sending the invoice email.",
                    Errors = new List<string> { ex.Message },
                    Data = false
                });
            }
        }

        /// <summary>
        /// Sends an order confirmation PDF as an email attachment
        /// </summary>
        /// <param name="orderId">The ID of the order</param>
        /// <returns>The result of the email sending operation</returns>
        [HttpPost("order/{orderId}/email")]
        public async Task<IActionResult> SendOrderConfirmationEmail(int orderId)
        {
            try
            {
                // Get the order and check company access
                var order = await _context.Orders.FindAsync(orderId);
                if (order == null)
                {
                    return NotFound(new ResponseDto<bool>
                    {
                        Success = false,
                        Message = $"Order not found with ID: {orderId}",
                        Data = false
                    });
                }

                if (!await ValidateCompanyAccess(order.CompanyId))
                {
                    return Forbid();
                }

                // Send the order confirmation email
                var result = await _documentService.SendOrderConfirmationWithPdfAsync(orderId);
                
                if (result)
                {
                    return Ok(new ResponseDto<bool>
                    {
                        Success = true,
                        Message = "Order confirmation email sent successfully.",
                        Data = true
                    });
                }
                else
                {
                    return StatusCode(500, new ResponseDto<bool>
                    {
                        Success = false,
                        Message = "Failed to send the order confirmation email.",
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
                    Message = "An error occurred while sending the order confirmation email.",
                    Errors = new List<string> { ex.Message },
                    Data = false
                });
            }
        }
    }
} 