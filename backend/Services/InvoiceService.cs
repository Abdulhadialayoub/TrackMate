using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly TrackMateDbContext _context;

        public InvoiceService(TrackMateDbContext context)
        {
            _context = context;
        }

        public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceDto createInvoiceDto)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Company)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == createInvoiceDto.OrderId);

            if (order == null)
                throw new ArgumentException("Order not found");

            var invoice = new Invoice
            {
                InvoiceNumber = GenerateInvoiceNumber(),
                OrderId = createInvoiceDto.OrderId,
                CustomerId = createInvoiceDto.CustomerId,
                CompanyId = createInvoiceDto.CompanyId,
                Status = "Pending",
                InvoiceDate = DateTime.UtcNow,
                DueDate = createInvoiceDto.DueDate,
                CreatedDate = DateTime.UtcNow
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Add invoice items from order items
            foreach (var orderItem in order.OrderItems)
            {
                var invoiceItem = new InvoiceItem
                {
                    InvoiceId = invoice.Id,
                    ProductId = orderItem.ProductId,
                    Quantity = orderItem.Quantity,
                    UnitPrice = orderItem.UnitPrice,
                    TotalPrice = orderItem.TotalPrice
                };

                _context.InvoiceItems.Add(invoiceItem);
            }

            await _context.SaveChangesAsync();

            // Calculate total amount
            invoice.TotalAmount = await _context.InvoiceItems
                .Where(ii => ii.InvoiceId == invoice.Id)
                .SumAsync(ii => ii.TotalPrice);

            await _context.SaveChangesAsync();

            return await GetInvoiceAsync(invoice.Id);
        }

        public async Task<InvoiceDto?> GetInvoiceAsync(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Order)
                .Include(i => i.Customer)
                .Include(i => i.Company)
                .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Product)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return null;

            return new InvoiceDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                OrderId = invoice.OrderId,
                OrderNumber = invoice.Order?.OrderNumber ?? string.Empty,
                CustomerId = invoice.CustomerId,
                CustomerName = invoice.Customer?.Name ?? string.Empty,
                CompanyId = invoice.CompanyId,
                CompanyName = invoice.Company?.Name ?? string.Empty,
                TotalAmount = invoice.TotalAmount,
                Status = invoice.Status,
                InvoiceDate = invoice.InvoiceDate,
                DueDate = invoice.DueDate,
                CreatedDate = invoice.CreatedDate,
                InvoiceItems = invoice.InvoiceItems.Select(ii => new InvoiceItemDto
                {
                    Id = ii.Id,
                    InvoiceId = ii.InvoiceId,
                    ProductId = ii.ProductId,
                    ProductName = ii.Product?.Name ?? string.Empty,
                    Quantity = ii.Quantity,
                    UnitPrice = ii.UnitPrice,
                    TotalPrice = ii.TotalPrice
                }).ToList()
            };
        }

        public async Task<IEnumerable<InvoiceDto>> GetInvoicesAsync()
        {
            var invoices = await _context.Invoices
                .Include(i => i.Order)
                .Include(i => i.Customer)
                .Include(i => i.Company)
                .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Product)
                .ToListAsync();

            return invoices.Select(i => new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                OrderId = i.OrderId,
                OrderNumber = i.Order?.OrderNumber ?? string.Empty,
                CustomerId = i.CustomerId,
                CustomerName = i.Customer?.Name ?? string.Empty,
                CompanyId = i.CompanyId,
                CompanyName = i.Company?.Name ?? string.Empty,
                TotalAmount = i.TotalAmount,
                Status = i.Status,
                InvoiceDate = i.InvoiceDate,
                DueDate = i.DueDate,
                CreatedDate = i.CreatedDate,
                InvoiceItems = i.InvoiceItems.Select(ii => new InvoiceItemDto
                {
                    Id = ii.Id,
                    InvoiceId = ii.InvoiceId,
                    ProductId = ii.ProductId,
                    ProductName = ii.Product?.Name ?? string.Empty,
                    Quantity = ii.Quantity,
                    UnitPrice = ii.UnitPrice,
                    TotalPrice = ii.TotalPrice
                }).ToList()
            });
        }

        public async Task<InvoiceDto?> UpdateInvoiceAsync(int id, UpdateInvoiceDto updateInvoiceDto)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return null;

            invoice.OrderId = updateInvoiceDto.OrderId;
            invoice.CustomerId = updateInvoiceDto.CustomerId;
            invoice.CompanyId = updateInvoiceDto.CompanyId;
            invoice.Status = updateInvoiceDto.Status;
            invoice.DueDate = updateInvoiceDto.DueDate;

            // Update invoice items
            _context.InvoiceItems.RemoveRange(invoice.InvoiceItems);

            foreach (var item in updateInvoiceDto.InvoiceItems)
            {
                var invoiceItem = new InvoiceItem
                {
                    InvoiceId = invoice.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice
                };

                _context.InvoiceItems.Add(invoiceItem);
            }

            // Recalculate total amount
            invoice.TotalAmount = updateInvoiceDto.InvoiceItems.Sum(item => item.Quantity * item.UnitPrice);

            await _context.SaveChangesAsync();

            return await GetInvoiceAsync(invoice.Id);
        }

        public async Task<bool> DeleteInvoiceAsync(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.InvoiceItems)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return false;

            _context.InvoiceItems.RemoveRange(invoice.InvoiceItems);
            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return true;
        }

        private string GenerateInvoiceNumber()
        {
            return $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8)}";
        }
    }
} 