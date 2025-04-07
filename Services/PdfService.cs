using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;
using TrackMate.API.Data;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Services
{
    public class PdfService : IPdfService
    {
        private readonly TrackMateDbContext _context;
        private readonly ILogger<PdfService> _logger;
        private readonly IConfiguration _configuration;

        public PdfService(TrackMateDbContext context, ILogger<PdfService> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
            
            // Register QuestPDF license (community edition)
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> GenerateInvoicePdfAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Company)
                .Include(i => i.Customer)
                .Include(i => i.Order)
                .Include(i => i.Bank)
                .Include(i => i.InvoiceItems)
                    .ThenInclude(ii => ii.Product)
                .FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted);

            if (invoice == null)
                throw new ApiException("Invoice not found", 404, "INVOICE_NOT_FOUND");

            return await GenerateInvoicePdfAsync(invoice);
        }

        public async Task<byte[]> GenerateInvoicePdfAsync(Invoice invoice)
        {
            try
            {
                var document = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(50);
                        page.DefaultTextStyle(x => x.FontSize(10));

                        page.Header().Element(ComposeHeader);
                        page.Content().Element(ComposeContent);
                        page.Footer().Element(ComposeFooter);

                        // Başlık
                        void ComposeHeader(IContainer container)
                        {
                            container.Row(row =>
                            {
                                row.RelativeItem().Column(column =>
                                {
                                    column.Item().Text($"{invoice.Company.Name}").Bold().FontSize(14);
                                    column.Item().Text(invoice.Company.Address);
                                    column.Item().Text($"Email: {invoice.Company.Email}");
                                    column.Item().Text($"Phone: {invoice.Company.Phone}");
                                    if (!string.IsNullOrEmpty(invoice.Company.TaxNumber))
                                        column.Item().Text($"Tax ID: {invoice.Company.TaxNumber}");
                                });

                                row.RelativeItem().Column(column =>
                                {
                                    column.Item().AlignRight().Text("INVOICE").Bold().FontSize(20);
                                    column.Item().AlignRight().Text($"Invoice #: {invoice.InvoiceNumber}");
                                    column.Item().AlignRight().Text($"Date: {invoice.InvoiceDate:yyyy-MM-dd}");
                                    column.Item().AlignRight().Text($"Due Date: {invoice.DueDate:yyyy-MM-dd}");
                                    column.Item().AlignRight().Text($"Status: {invoice.Status}");
                                });
                            });
                        }

                        // İçerik
                        void ComposeContent(IContainer container)
                        {
                            container.PaddingVertical(30).Column(column =>
                            {
                                // Müşteri bilgileri
                                column.Item().Column(c =>
                                {
                                    c.Item().Text("Bill To:").Bold();
                                    c.Item().Text(invoice.Customer.Name);
                                    c.Item().Text(invoice.Customer.Address);
                                    if (!string.IsNullOrEmpty(invoice.Customer.Email))
                                        c.Item().Text($"Email: {invoice.Customer.Email}");
                                    if (!string.IsNullOrEmpty(invoice.Customer.Phone))
                                        c.Item().Text($"Phone: {invoice.Customer.Phone}");
                                });

                                // Ürünler tablosu
                                column.Item().PaddingTop(20).Element(ComposeTable);

                                // Toplamlar
                                column.Item().AlignRight().PaddingTop(10).Column(c =>
                                {
                                    c.Item().Text($"Subtotal: {invoice.Subtotal:N2} {invoice.Currency}");
                                    if (invoice.TaxAmount > 0)
                                        c.Item().Text($"Tax ({invoice.TaxRate}%): {invoice.TaxAmount:N2} {invoice.Currency}");
                                    if (invoice.ShippingCost > 0)
                                        c.Item().Text($"Shipping: {invoice.ShippingCost:N2} {invoice.Currency}");
                                    c.Item().Text($"Total: {invoice.Total:N2} {invoice.Currency}").Bold();
                                });

                                // Ödeme bilgileri (varsa)
                                if (invoice.Bank != null)
                                {
                                    column.Item().PaddingTop(20).Column(c =>
                                    {
                                        c.Item().Text("Payment Details:").Bold();
                                        c.Item().Text($"Bank Name: {invoice.Bank.BankName}");
                                        if (!string.IsNullOrEmpty(invoice.Bank.AccountNumber))
                                            c.Item().Text($"Account Number: {invoice.Bank.AccountNumber}");
                                        if (!string.IsNullOrEmpty(invoice.Bank.IBAN))
                                            c.Item().Text($"IBAN: {invoice.Bank.IBAN}");
                                        if (!string.IsNullOrEmpty(invoice.Bank.SWIFT))
                                            c.Item().Text($"SWIFT Code: {invoice.Bank.SWIFT}");
                                    });
                                }

                                // Notlar
                                if (!string.IsNullOrEmpty(invoice.Notes))
                                {
                                    column.Item().PaddingTop(20).Column(c =>
                                    {
                                        c.Item().Text("Notes:").Bold();
                                        c.Item().Text(invoice.Notes);
                                    });
                                }
                            });

                            // Ürünler tablosu
                            void ComposeTable(IContainer container)
                            {
                                container.Table(table =>
                                {
                                    table.ColumnsDefinition(columns =>
                                    {
                                        columns.RelativeColumn(3);
                                        columns.RelativeColumn();
                                        columns.RelativeColumn();
                                        columns.RelativeColumn();
                                        columns.RelativeColumn();
                                    });

                                    table.Header(header =>
                                    {
                                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Description").Bold();
                                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Quantity").Bold();
                                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Unit Price").Bold();
                                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Tax").Bold();
                                        header.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Amount").Bold();
                                    });

                                    foreach (var item in invoice.InvoiceItems)
                                    {
                                        var rowTotal = item.Quantity * item.UnitPrice;
                                        var taxAmount = rowTotal * (item.TaxRate / 100);
                                        var lineTotal = rowTotal + taxAmount;

                                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(item.Product?.Name ?? item.Description);
                                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"{item.Quantity}");
                                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"{item.UnitPrice:N2}");
                                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"{item.TaxRate}%");
                                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5).Text($"{lineTotal:N2}");
                                    }
                                });
                            }
                        }

                        // Altbilgi
                        void ComposeFooter(IContainer container)
                        {
                            container.Row(row =>
                            {
                                row.RelativeItem().Column(column =>
                                {
                                    column.Item().Text(invoice.Company.Name);
                                    column.Item().Text($"© {DateTime.Now.Year} All Rights Reserved");
                                });

                                row.RelativeItem().AlignRight().Text(text =>
                                {
                                    text.Span("Page ");
                                    text.CurrentPageNumber();
                                    text.Span(" of ");
                                    text.TotalPages();
                                });
                            });
                        }
                    });
                });

                // PDF bayt dizisini oluştur
                var pdfBytes = await Task.FromResult(document.GeneratePdf());
                return pdfBytes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating PDF for invoice {InvoiceId}", invoice.Id);
                throw new ApiException("Failed to generate invoice PDF", 500, "PDF_GENERATION_FAILED");
            }
        }

        public async Task<string> SaveInvoicePdfAsync(int invoiceId)
        {
            try
            {
                var pdfBytes = await GenerateInvoicePdfAsync(invoiceId);
                var invoice = await _context.Invoices.FindAsync(invoiceId);
                
                if (invoice == null)
                    throw new ApiException("Invoice not found", 404, "INVOICE_NOT_FOUND");

                // Get the storage directory from configuration or use a default
                var storageDirectory = _configuration["PdfStorage:Directory"] ?? "wwwroot/invoices";
                
                // Create directory if it doesn't exist
                if (!Directory.Exists(storageDirectory))
                    Directory.CreateDirectory(storageDirectory);

                // Generate a unique filename based on invoice details
                string fileName = $"Invoice_{invoice.InvoiceNumber.Replace("-", "_")}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
                string filePath = Path.Combine(storageDirectory, fileName);

                // Save the PDF file
                await File.WriteAllBytesAsync(filePath, pdfBytes);

                // Return relative path that can be used in an API response
                return filePath.Replace("wwwroot/", "/");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving PDF for invoice {InvoiceId}", invoiceId);
                throw new ApiException("Failed to save invoice PDF", 500, "PDF_SAVE_FAILED");
            }
        }
        
        public async Task<Invoice> SavePdfToDatabaseAsync(int invoiceId, bool saveToDatabase = true, bool saveToFileSystem = true)
        {
            try
            {
                var pdfBytes = await GenerateInvoicePdfAsync(invoiceId);
                var invoice = await _context.Invoices.FindAsync(invoiceId);
                
                if (invoice == null)
                    throw new ApiException("Invoice not found", 404, "INVOICE_NOT_FOUND");
                
                string filePath = null;
                
                // Dosya sistemine kaydet
                if (saveToFileSystem)
                {
                    // Get the storage directory from configuration or use a default
                    var storageDirectory = _configuration["PdfStorage:Directory"] ?? "wwwroot/invoices";
                    
                    // Create directory if it doesn't exist
                    if (!Directory.Exists(storageDirectory))
                        Directory.CreateDirectory(storageDirectory);

                    // Generate a unique filename based on invoice details
                    string fileName = $"Invoice_{invoice.InvoiceNumber.Replace("-", "_")}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
                    filePath = Path.Combine(storageDirectory, fileName);

                    // Save the PDF file
                    await File.WriteAllBytesAsync(filePath, pdfBytes);
                    
                    // Convert to relative URL path if saved in wwwroot
                    if (filePath.Contains("wwwroot"))
                    {
                        filePath = filePath.Replace("wwwroot/", "/");
                    }
                }
                
                // Veritabanına kaydet
                if (saveToDatabase || saveToFileSystem)
                {
                    if (saveToDatabase)
                    {
                        invoice.PdfContent = pdfBytes;
                    }
                    
                    if (saveToFileSystem)
                    {
                        invoice.PdfFilePath = filePath;
                    }
                    
                    invoice.PdfGeneratedDate = DateTime.UtcNow;
                    invoice.UpdatedAt = DateTime.UtcNow;
                    
                    _context.Invoices.Update(invoice);
                    await _context.SaveChangesAsync();
                }
                
                return invoice;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving PDF to database for invoice {InvoiceId}", invoiceId);
                throw new ApiException("Failed to save invoice PDF to database", 500, "PDF_DATABASE_SAVE_FAILED");
            }
        }
    }
} 