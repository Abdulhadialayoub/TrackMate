using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;
using AutoMapper;

namespace TrackMate.API.Services
{
    public class InvoiceService : BaseService<Invoice, InvoiceDto, CreateInvoiceDto, UpdateInvoiceDto>, IInvoiceService
    {
        private readonly IPdfService _pdfService;

        public InvoiceService(TrackMateDbContext context, IMapper mapper, ILogger<InvoiceService> logger, IPdfService pdfService)
            : base(context, mapper, logger)
        {
            _pdfService = pdfService;
        }

        protected override async Task<Invoice> GetEntityByIdAsync(int id)
        {
            return await _dbSet
                .Include(i => i.Company)
                .Include(i => i.Customer)
                .Include(i => i.Order)
                .Include(i => i.Bank)
                .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Product)
                .FirstOrDefaultAsync(i => i.Id == id && !i.IsDeleted);
        }

        public async Task<IEnumerable<InvoiceDto>> GetInvoicesAsync()
        {
            return await GetAllAsync();
        }

        public async Task<InvoiceDto> GetInvoiceByIdAsync(int id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<IEnumerable<InvoiceDto>> GetInvoicesByCompanyIdAsync(int companyId)
        {
            return await GetByCompanyIdAsync(companyId);
        }

        public async Task<IEnumerable<InvoiceDto>> GetByCustomerIdAsync(int customerId)
        {
            var invoices = await _dbSet
                .Include(i => i.Company)
                .Include(i => i.Customer)
                .Include(i => i.Order)
                .Include(i => i.Bank)
                .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Product)
                .Where(i => i.CustomerId == customerId && !i.IsDeleted)
                .ToListAsync();

            return _mapper.Map<IEnumerable<InvoiceDto>>(invoices);
        }

        public async Task<InvoiceDto> GetByOrderIdAsync(int orderId)
        {
            var invoice = await _dbSet
                .Include(i => i.Company)
                .Include(i => i.Customer)
                .Include(i => i.Order)
                .Include(i => i.Bank)
                .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Product)
                .FirstOrDefaultAsync(i => i.OrderId == orderId && !i.IsDeleted);

            if (invoice == null)
                return null;

            return _mapper.Map<InvoiceDto>(invoice);
        }

        public async Task<InvoiceDto> UpdateStatusAsync(int id, UpdateInvoiceStatusDto statusDto)
        {
            var invoice = await GetEntityByIdAsync(id);
            if (invoice == null)
                throw new ApiException("Invoice not found", 404, "INVOICE_NOT_FOUND");

            invoice.Status = statusDto.Status.ToString();
            invoice.UpdatedAt = DateTime.UtcNow;

            _dbSet.Update(invoice);
            await _context.SaveChangesAsync();

            return _mapper.Map<InvoiceDto>(invoice);
        }

        public async Task<InvoiceDto> AddInvoiceItemAsync(int invoiceId, CreateInvoiceItemDto invoiceItemDto)
        {
            var invoice = await GetEntityByIdAsync(invoiceId);
            if (invoice == null)
                throw new ApiException("Invoice not found", 404, "INVOICE_NOT_FOUND");

            var product = await _context.Products.FindAsync(invoiceItemDto.ProductId);
            if (product == null)
                throw new ApiException("Product not found", 404, "PRODUCT_NOT_FOUND");

            var invoiceItem = _mapper.Map<InvoiceItem>(invoiceItemDto);
            invoiceItem.InvoiceId = invoiceId;
            invoiceItem.CreatedAt = DateTime.UtcNow;

            _context.InvoiceItems.Add(invoiceItem);
            await _context.SaveChangesAsync();

            // Recalculate invoice totals
            await RecalculateInvoiceTotalsAsync(invoice);

            return await GetByIdAsync(invoiceId);
        }

        public async Task<InvoiceDto> RemoveInvoiceItemAsync(int invoiceId, int itemId)
        {
            var invoice = await GetEntityByIdAsync(invoiceId);
            if (invoice == null)
                throw new ApiException("Invoice not found", 404, "INVOICE_NOT_FOUND");

            var invoiceItem = await _context.InvoiceItems.FindAsync(itemId);
            if (invoiceItem == null || invoiceItem.InvoiceId != invoiceId)
                throw new ApiException("Invoice item not found", 404, "INVOICE_ITEM_NOT_FOUND");

            _context.InvoiceItems.Remove(invoiceItem);
            await _context.SaveChangesAsync();

            // Recalculate invoice totals
            await RecalculateInvoiceTotalsAsync(invoice);

            return await GetByIdAsync(invoiceId);
        }

        public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto dto)
        {
            // Validate company exists
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            // Validate customer exists
            var customer = await _context.Customers.FindAsync(dto.CustomerId);
            if (customer == null)
                throw new ApiException("Customer not found", 404, "CUSTOMER_NOT_FOUND");

            // Validate order exists if provided
            if (dto.OrderId.HasValue)
            {
                var order = await _context.Orders.FindAsync(dto.OrderId.Value);
                if (order == null)
                    throw new ApiException("Order not found", 404, "ORDER_NOT_FOUND");
            }

            // Validate bank details exist
            if (dto.BankDetailsId.HasValue)
            {
                var bankDetails = await _context.CompanyBankDetails.FindAsync(dto.BankDetailsId.Value);
                if (bankDetails == null)
                    throw new ApiException("Bank details not found", 404, "BANK_DETAILS_NOT_FOUND");
            }

            dto.InvoiceNumber = await GenerateInvoiceNumberAsync(dto.CompanyId);
            return await CreateAsync(dto);
        }

        public async Task<InvoiceDto> UpdateInvoiceAsync(int id, UpdateInvoiceDto dto)
        {
            var existingInvoice = await GetEntityByIdAsync(id);
            if (existingInvoice == null)
                throw new ApiException("Invoice not found", 404, "INVOICE_NOT_FOUND");

            // Validate order exists if provided
            if (dto.OrderId.HasValue)
            {
                var order = await _context.Orders.FindAsync(dto.OrderId.Value);
                if (order == null)
                    throw new ApiException("Order not found", 404, "ORDER_NOT_FOUND");
            }

            // Validate bank details exist
            if (dto.BankDetailsId.HasValue)
            {
                var bankDetails = await _context.CompanyBankDetails.FindAsync(dto.BankDetailsId.Value);
                if (bankDetails == null)
                    throw new ApiException("Bank details not found", 404, "BANK_DETAILS_NOT_FOUND");
            }

            return await UpdateAsync(id, dto);
        }

        public async Task DeleteInvoiceAsync(int id)
        {
            await DeleteAsync(id);
        }

        public async Task<string> GenerateInvoiceNumberAsync(int companyId)
        {
            var lastInvoice = await _dbSet
                .Where(i => i.CompanyId == companyId)
                .OrderByDescending(i => i.Id)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastInvoice != null)
            {
                var currentNumber = int.Parse(lastInvoice.InvoiceNumber.Split('-').Last());
                nextNumber = currentNumber + 1;
            }

            return $"INV-{companyId}-{nextNumber:D6}";
        }

        private async Task RecalculateInvoiceTotalsAsync(Invoice invoice)
        {
            await _context.Entry(invoice)
                .Collection(i => i.InvoiceItems)
                .LoadAsync();

            invoice.Subtotal = invoice.InvoiceItems.Sum(item => item.Quantity * item.UnitPrice);
            invoice.TaxAmount = invoice.InvoiceItems.Sum(item => 
                item.Quantity * item.UnitPrice * (item.TaxRate / 100));
            invoice.Total = invoice.Subtotal + invoice.TaxAmount;
            invoice.UpdatedAt = DateTime.UtcNow;

            _dbSet.Update(invoice);
            await _context.SaveChangesAsync();
        }

        // Implement PDF generation methods
        public async Task<byte[]> GenerateInvoicePdfAsync(int invoiceId)
        {
            return await _pdfService.GenerateInvoicePdfAsync(invoiceId);
        }

        public async Task<string> SaveInvoicePdfAsync(int invoiceId)
        {
            return await _pdfService.SaveInvoicePdfAsync(invoiceId);
        }
        
        public async Task<InvoiceDto> SavePdfToDatabaseAsync(int invoiceId, bool saveToDatabase = true, bool saveToFileSystem = true)
        {
            var invoice = await _pdfService.SavePdfToDatabaseAsync(invoiceId, saveToDatabase, saveToFileSystem);
            return _mapper.Map<InvoiceDto>(invoice);
        }
    }
} 