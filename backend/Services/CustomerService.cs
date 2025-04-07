using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Services
{
    public class CustomerService : BaseService<Customer, CustomerDto, CreateCustomerDto, UpdateCustomerDto>, ICustomerService
    {
        public CustomerService(TrackMateDbContext context, IMapper mapper, ILogger<CustomerService> logger)
            : base(context, mapper, logger)
        {
        }

        protected override async Task<Customer> GetEntityByIdAsync(int id)
        {
            return await _dbSet
                .Include(c => c.Orders)
                .Include(c => c.Invoices)
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        }

        public override async Task<CustomerDto> GetByIdAsync(int id)
        {
            var customer = await GetEntityByIdAsync(id);
            if (customer == null)
                return null;

            var dto = _mapper.Map<CustomerDto>(customer);
            dto.OrderCount = customer.Orders?.Count ?? 0;
            dto.InvoiceCount = customer.Invoices?.Count ?? 0;
            
            return dto;
        }

        public async Task<IEnumerable<OrderDto>> GetCustomerOrdersAsync(int customerId)
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .Where(o => o.CustomerId == customerId && !o.IsDeleted)
                .ToListAsync();

            return _mapper.Map<IEnumerable<OrderDto>>(orders);
        }

        public async Task<IEnumerable<InvoiceDto>> GetCustomerInvoicesAsync(int customerId)
        {
            var invoices = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .Where(i => i.CustomerId == customerId && !i.IsDeleted)
                .ToListAsync();

            return _mapper.Map<IEnumerable<InvoiceDto>>(invoices);
        }

        public async Task<CustomerDto> UpdateStatusAsync(int id, CustomerStatus status)
        {
            var customer = await GetEntityByIdAsync(id);
            if (customer == null)
                return null;

            customer.Status = status;
            customer.UpdatedAt = DateTime.UtcNow;

            _dbSet.Update(customer);
            await _context.SaveChangesAsync();

            return _mapper.Map<CustomerDto>(customer);
        }

        public async Task<IEnumerable<CustomerDto>> GetCustomersAsync()
        {
            return await GetAllAsync();
        }

        public async Task<CustomerDto> GetCustomerByIdAsync(int id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<IEnumerable<CustomerDto>> GetCustomersByCompanyIdAsync(int companyId)
        {
            return await GetByCompanyIdAsync(companyId);
        }

        public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto)
        {
            // Validate company exists
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            // Validate tax number uniqueness within company
            if (await _dbSet.AnyAsync(c => c.CompanyId == dto.CompanyId && c.TaxNumber == dto.TaxNumber && !c.IsDeleted))
                throw new ApiException("Customer with this tax number already exists", 400, "DUPLICATE_TAX_NUMBER");

            return await CreateAsync(dto);
        }

        public async Task<CustomerDto> UpdateCustomerAsync(int id, UpdateCustomerDto dto)
        {
            var existingCustomer = await GetEntityByIdAsync(id);
            if (existingCustomer == null)
                throw new ApiException("Customer not found", 404, "CUSTOMER_NOT_FOUND");

            // Validate tax number uniqueness within company
            if (await _dbSet.AnyAsync(c => c.CompanyId == existingCustomer.CompanyId && c.TaxNumber == dto.TaxNumber && c.Id != id && !c.IsDeleted))
                throw new ApiException("Customer with this tax number already exists", 400, "DUPLICATE_TAX_NUMBER");

            return await UpdateAsync(id, dto);
        }

        public async Task DeleteCustomerAsync(int id)
        {
            // Check if customer has any orders
            var hasOrders = await _context.Orders.AnyAsync(o => o.CustomerId == id && !o.IsDeleted);
            if (hasOrders)
                throw new ApiException("Cannot delete customer with existing orders", 400, "CUSTOMER_HAS_ORDERS");

            await DeleteAsync(id);
        }
    }
} 