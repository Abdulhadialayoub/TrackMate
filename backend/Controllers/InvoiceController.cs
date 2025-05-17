using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;
using TrackMate.API.Exceptions;
using Microsoft.Extensions.Logging;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : BaseController
    {
        private readonly IInvoiceService _invoiceService;
        private readonly ILogger<InvoiceController> _logger;

        public InvoiceController(
            IInvoiceService invoiceService,
            ILogger<InvoiceController> logger)
        {
            _invoiceService = invoiceService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetAll()
        {
            try
            {
                _logger.LogInformation("Fetching all invoices");
                var invoices = await _invoiceService.GetInvoicesAsync();
                _logger.LogInformation($"Returning {invoices.Count()} invoices");
                return Ok(invoices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all invoices");
                return StatusCode(500, new { message = "Error fetching invoices", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceDto>> GetById(int id)
        {
            return await ExecuteAsync(async () => await _invoiceService.GetByIdAsync(id));
        }

        [HttpGet("company/{companyId}")]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetByCompanyId(int companyId)
        {
            return await ExecuteWithValidationAsync(companyId, async () => await _invoiceService.GetByCompanyIdAsync(companyId));
        }

        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetByCustomerId(int customerId)
        {
            var invoice = await _invoiceService.GetByIdAsync(customerId);
            if (invoice == null)
            {
                return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => await _invoiceService.GetByCustomerIdAsync(customerId)
            );
        }

        [HttpGet("order/{orderId}")]
        public async Task<ActionResult<InvoiceDto>> GetByOrderId(int orderId)
        {
            var invoice = await _invoiceService.GetByIdAsync(orderId);
            if (invoice == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => await _invoiceService.GetByOrderIdAsync(orderId)
            );
        }

        [HttpPost]
        public async Task<ActionResult<InvoiceDto>> Create([FromBody] CreateInvoiceDto createInvoiceDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdInvoice = await _invoiceService.CreateAsync(createInvoiceDto);
            return CreatedAtAction(nameof(GetById), new { id = createdInvoice.Id }, createdInvoice);
        }

        [HttpPost("fromOrder/{orderId}")]
        public async Task<ActionResult<InvoiceDto>> CreateFromOrder(int orderId)
        {
            _logger.LogInformation($"Creating invoice from order ID: {orderId}");
            
            // First get the order to check if it exists and validate company access
            try 
            {
                var orderService = HttpContext.RequestServices.GetRequiredService<IOrderService>();
                var order = await orderService.GetByIdAsync(orderId);
                
                if (order == null)
                {
                    return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
                }
                
                // Validate company access (user can only create invoices for their company)
                return await ExecuteWithValidationAsync(
                    order.CompanyId,
                    async () => await _invoiceService.CreateFromOrderAsync(orderId)
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating invoice from order {orderId}");
                return StatusCode(500, new { message = "Error creating invoice from order", details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<InvoiceDto>> Update(int id, [FromBody] UpdateInvoiceDto updateInvoiceDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => await _invoiceService.UpdateAsync(id, updateInvoiceDto)
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => await _invoiceService.DeleteAsync(id)
            );
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<InvoiceDto>> UpdateStatus(int id, [FromBody] UpdateInvoiceStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => await _invoiceService.UpdateStatusAsync(id, statusDto)
            );
        }

        [HttpPost("{id}/items")]
        public async Task<ActionResult<InvoiceDto>> AddInvoiceItem(int id, [FromBody] CreateInvoiceItemDto invoiceItemDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => await _invoiceService.AddInvoiceItemAsync(id, invoiceItemDto)
            );
        }

        [HttpDelete("{id}/items/{itemId}")]
        public async Task<ActionResult<InvoiceDto>> RemoveInvoiceItem(int id, int itemId)
        {
            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => await _invoiceService.RemoveInvoiceItemAsync(id, itemId)
            );
        }

        [HttpGet("{id}/pdf")]
        public async Task<IActionResult> GetInvoicePdf(int id)
        {
            try
            {
                _logger.LogInformation($"Generating PDF for invoice ID: {id}");
                
                var invoice = await _invoiceService.GetByIdAsync(id);
                if (invoice == null)
                {
                    _logger.LogWarning($"Invoice not found with ID: {id}");
                    return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
                }
                
                // Validate company access
                if (!await ValidateCompanyAccess(invoice.CompanyId))
                {
                    _logger.LogWarning($"Unauthorized access attempt to invoice ID: {id}");
                    return Forbid();
                }
                
                // Generate the PDF
                _logger.LogInformation($"Calling PDF service to generate PDF for invoice ID: {id}");
                var pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(id);
                
                if (pdfBytes == null)
                {
                    _logger.LogError($"PDF service returned null for invoice ID: {id}");
                    return StatusCode(500, new { message = "Failed to generate PDF: Service returned null" });
                }
                
                if (pdfBytes.Length == 0)
                {
                    _logger.LogError($"PDF service returned empty PDF for invoice ID: {id}");
                    return StatusCode(500, new { message = "Failed to generate PDF: Empty document generated" });
                }
                
                _logger.LogInformation($"Successfully generated PDF of size {pdfBytes.Length} bytes for invoice ID: {id}");
                
                // Log first few bytes to see if it's a valid PDF
                if (pdfBytes.Length >= 10)
                {
                    var headerBytes = new byte[Math.Min(10, pdfBytes.Length)];
                    Array.Copy(pdfBytes, headerBytes, headerBytes.Length);
                    _logger.LogInformation($"PDF header bytes: {Convert.ToBase64String(headerBytes)}");
                }
                
                // Check for debugging query parameter
                bool isDebug = Request.Query.ContainsKey("debug") && Request.Query["debug"] == "true";
                if (isDebug)
                {
                    _logger.LogInformation("Returning debug information about PDF instead of the actual PDF");
                    return Ok(new 
                    { 
                        message = "PDF generated successfully", 
                        size = pdfBytes.Length,
                        isValidPdf = pdfBytes.Length > 5 && 
                                     pdfBytes[0] == 0x25 && // %
                                     pdfBytes[1] == 0x50 && // P
                                     pdfBytes[2] == 0x44 && // D
                                     pdfBytes[3] == 0x46 && // F
                                     pdfBytes[4] == 0x2D    // -
                    });
                }
                
                // Try a completely different way of returning the file
                try
                {
                    // Clear existing headers to avoid conflicts
                    Response.Headers.Clear();
                    
                    // Set multiple headers for compatibility with different browsers/clients
                    Response.Headers.Append("X-Content-Type-Options", "nosniff");
                    Response.Headers.Append("Content-Disposition", $"inline; filename=\"Invoice_{invoice.InvoiceNumber.Replace("-", "_")}.pdf\"");
                    Response.Headers.Append("Cache-Control", "max-age=300, must-revalidate");
                    
                    // Set content type explicitly
                    Response.ContentType = "application/pdf";
                    
                    // Create a memory stream to buffer the data first
                    using (var ms = new MemoryStream(pdfBytes))
                    {
                        // Write to response stream
                        await ms.CopyToAsync(Response.Body);
                        await Response.Body.FlushAsync();
                    }
                    
                    return new EmptyResult();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error writing PDF directly to response for invoice {InvoiceId}", id);
                    
                    // Fallback to standard method if direct write fails
                    _logger.LogInformation("Falling back to standard File result for invoice {InvoiceId}", id);
                    
                    return new FileContentResult(pdfBytes, "application/pdf")
                    {
                        FileDownloadName = $"Invoice_{invoice.InvoiceNumber.Replace("-", "_")}.pdf",
                        EnableRangeProcessing = true // Support partial content requests
                    };
                }
            }
            catch (ApiException aex)
            {
                _logger.LogError(aex, $"API exception generating PDF for invoice ID: {id}: {aex.Message}");
                return StatusCode(aex.StatusCode, new { message = aex.Message, code = aex.Code });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating PDF for invoice ID: {id}");
                return StatusCode(500, new { message = $"Failed to generate PDF: {ex.Message}" });
            }
        }

        [HttpGet("{id}/pdf/save")]
        public async Task<IActionResult> SaveInvoicePdf(int id)
        {
            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => 
                {
                    var pdfPath = await _invoiceService.SaveInvoicePdfAsync(id);
                    return Ok(new { filePath = pdfPath });
                }
            );
        }
        
        [HttpPost("{id}/pdf/save-to-db")]
        public async Task<ActionResult<InvoiceDto>> SaveInvoicePdfToDatabase(int id, [FromQuery] bool saveToDatabase = true, [FromQuery] bool saveToFileSystem = true)
        {
            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => await _invoiceService.SavePdfToDatabaseAsync(id, saveToDatabase, saveToFileSystem)
            );
        }
    }
} 