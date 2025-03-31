using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : BaseController
    {
        private readonly IInvoiceService _invoiceService;

        public InvoiceController(IInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<InvoiceDto>> CreateInvoice(CreateInvoiceDto createInvoiceDto)
        {
            var invoice = await _invoiceService.CreateInvoiceAsync(createInvoiceDto);
            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceDto>> GetInvoice(int id)
        {
            var invoice = await _invoiceService.GetInvoiceAsync(id);
            if (invoice == null)
                return NotFound();

            if (!IsAuthorizedForCompany(invoice.CompanyId))
                return Forbid();

            return Ok(invoice);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoices()
        {
            var invoices = await _invoiceService.GetInvoicesAsync();
            var authorizedInvoices = invoices.Where(i => IsAuthorizedForCompany(i.CompanyId));
            return Ok(authorizedInvoices);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<InvoiceDto>> UpdateInvoice(int id, UpdateInvoiceDto updateInvoiceDto)
        {
            var invoice = await _invoiceService.GetInvoiceAsync(id);
            if (invoice == null)
                return NotFound();

            if (!IsAuthorizedForCompany(invoice.CompanyId))
                return Forbid();

            var updatedInvoice = await _invoiceService.UpdateInvoiceAsync(id, updateInvoiceDto);
            if (updatedInvoice == null)
                return NotFound();

            return Ok(updatedInvoice);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult> DeleteInvoice(int id)
        {
            var invoice = await _invoiceService.GetInvoiceAsync(id);
            if (invoice == null)
                return NotFound();

            if (!IsAuthorizedForCompany(invoice.CompanyId))
                return Forbid();

            var result = await _invoiceService.DeleteInvoiceAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
} 