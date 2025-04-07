using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;
using TrackMate.API.Exceptions;
using Microsoft.Extensions.Logging;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : BaseController
    {
        private readonly ICustomerService _customerService;
        private readonly ILogger<CustomerController> _logger;

        public CustomerController(
            ICustomerService customerService,
            ILogger<CustomerController> logger)
        {
            _customerService = customerService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll()
        {
            return await ExecuteAsync(async () => await _customerService.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDto>> GetById(int id)
        {
            return await ExecuteAsync(async () => await _customerService.GetByIdAsync(id));
        }

        [HttpGet("company/{companyId}")]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetByCompanyId(int companyId)
        {
            return await ExecuteWithValidationAsync(companyId, async () => await _customerService.GetByCompanyIdAsync(companyId));
        }

        [HttpPost]
        public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerDto createCustomerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdCustomer = await _customerService.CreateAsync(createCustomerDto);
            
            return await ExecuteCreateAsync(
                async () => createdCustomer,
                nameof(GetById),
                new { id = createdCustomer.Id }
            );
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CustomerDto>> Update(int id, [FromBody] UpdateCustomerDto updateCustomerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                customer.CompanyId,
                async () => await _customerService.UpdateAsync(id, updateCustomerDto)
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                customer.CompanyId,
                async () => await _customerService.DeleteAsync(id)
            );
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<CustomerDto>> UpdateStatus(int id, [FromBody] UpdateCustomerStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                customer.CompanyId,
                async () => await _customerService.UpdateStatusAsync(id, statusDto.Status)
            );
        }

        [HttpGet("{id}/orders")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetCustomerOrders(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                customer.CompanyId,
                async () => await _customerService.GetCustomerOrdersAsync(id)
            );
        }

        [HttpGet("{id}/invoices")]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetCustomerInvoices(int id)
        {
            var customer = await _customerService.GetByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                customer.CompanyId,
                async () => await _customerService.GetCustomerInvoicesAsync(id)
            );
        }
    }
} 