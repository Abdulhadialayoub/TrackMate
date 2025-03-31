using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly TrackMateDbContext _context;

        public CustomerService(TrackMateDbContext context)
        {
            _context = context;
        }

        public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto createCustomerDto)
        {
            var customer = new Customer
            {
                Name = createCustomerDto.Name,
                Email = createCustomerDto.Email,
                Phone = createCustomerDto.Phone,
                Address = createCustomerDto.Address,
                CompanyId = createCustomerDto.CompanyId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return new CustomerDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Address = customer.Address,
                CompanyId = customer.CompanyId,
                CompanyName = customer.Company?.Name ?? string.Empty,
                CreatedDate = customer.CreatedDate
            };
        }

        public async Task<CustomerDto?> GetCustomerAsync(int id)
        {
            var customer = await _context.Customers
                .Include(c => c.Company)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null) return null;

            return new CustomerDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Address = customer.Address,
                CompanyId = customer.CompanyId,
                CompanyName = customer.Company?.Name ?? string.Empty,
                CreatedDate = customer.CreatedDate
            };
        }

        public async Task<IEnumerable<CustomerDto>> GetCustomersAsync()
        {
            var customers = await _context.Customers
                .Include(c => c.Company)
                .ToListAsync();

            return customers.Select(c => new CustomerDto
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                Address = c.Address,
                CompanyId = c.CompanyId,
                CompanyName = c.Company?.Name ?? string.Empty,
                CreatedDate = c.CreatedDate
            });
        }

        public async Task<CustomerDto?> UpdateCustomerAsync(int id, UpdateCustomerDto updateCustomerDto)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return null;

            customer.Name = updateCustomerDto.Name;
            customer.Email = updateCustomerDto.Email;
            customer.Phone = updateCustomerDto.Phone;
            customer.Address = updateCustomerDto.Address;
            customer.CompanyId = updateCustomerDto.CompanyId;

            await _context.SaveChangesAsync();

            return new CustomerDto
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Address = customer.Address,
                CompanyId = customer.CompanyId,
                CompanyName = customer.Company?.Name ?? string.Empty,
                CreatedDate = customer.CreatedDate
            };
        }

        public async Task<bool> DeleteCustomerAsync(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return false;

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 