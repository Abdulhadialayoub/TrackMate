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
            return await ExecuteAsync(async () => await _invoiceService.GetAllAsync());
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
            var invoice = await _invoiceService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Invoice not found", code = "INVOICE_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                invoice.CompanyId,
                async () => 
                {
                    var pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(id);
                    return File(pdfBytes, "application/pdf", $"Invoice_{invoice.InvoiceNumber}.pdf");
                }
            );
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