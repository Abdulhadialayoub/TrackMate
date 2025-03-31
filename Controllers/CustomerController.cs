using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : BaseController
    {
        private readonly ICustomerService _customerService;

        public CustomerController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<CustomerDto>> CreateCustomer(CreateCustomerDto createCustomerDto)
        {
            var customer = await _customerService.CreateCustomerAsync(createCustomerDto);
            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerDto>> GetCustomer(int id)
        {
            var customer = await _customerService.GetCustomerAsync(id);
            if (customer == null)
                return NotFound();

            if (!IsAuthorizedForCompany(customer.CompanyId))
                return Forbid();

            return Ok(customer);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers()
        {
            var customers = await _customerService.GetCustomersAsync();
            var authorizedCustomers = customers.Where(c => IsAuthorizedForCompany(c.CompanyId));
            return Ok(authorizedCustomers);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<CustomerDto>> UpdateCustomer(int id, UpdateCustomerDto updateCustomerDto)
        {
            var customer = await _customerService.GetCustomerAsync(id);
            if (customer == null)
                return NotFound();

            if (!IsAuthorizedForCompany(customer.CompanyId))
                return Forbid();

            var updatedCustomer = await _customerService.UpdateCustomerAsync(id, updateCustomerDto);
            if (updatedCustomer == null)
                return NotFound();

            return Ok(updatedCustomer);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult> DeleteCustomer(int id)
        {
            var customer = await _customerService.GetCustomerAsync(id);
            if (customer == null)
                return NotFound();

            if (!IsAuthorizedForCompany(customer.CompanyId))
                return Forbid();

            var result = await _customerService.DeleteCustomerAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
} 