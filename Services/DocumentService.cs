using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TrackMate.API.Data;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace TrackMate.API.Services
{
    public class DocumentService : IDocumentService
    {
        private readonly TrackMateDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(
            TrackMateDbContext context,
            IEmailService emailService,
            ILogger<DocumentService> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<byte[]> GenerateInvoicePdfAsync(int invoiceId)
        {
            try
            {
                _logger.LogInformation($"Generating invoice PDF for Invoice ID: {invoiceId}");

                // Get the invoice with all related data
                var invoice = await _context.Invoices
                    .Include(i => i.Company)
                    .Include(i => i.Customer)
                    .Include(i => i.InvoiceItems)
                        .ThenInclude(ii => ii.Product)
                    .FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted);

                if (invoice == null)
                {
                    _logger.LogWarning($"Invoice not found for ID: {invoiceId}");
                    throw new Exception($"Invoice not found for ID: {invoiceId}");
                }

                // Generate PDF using QuestPDF library
                var document = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        // Page setup
                        page.Size(PageSizes.A4);
                        page.Margin(50);
                        page.DefaultTextStyle(x => x.FontSize(10));

                        // Header
                        page.Header().Element(ComposeHeader);

                        // Content
                        page.Content().Element(container => ComposeContent(container, invoice));

                        // Footer
                        page.Footer().Element(ComposeFooter);

                        // Local functions for PDF composition
                        void ComposeHeader(IContainer container)
                        {
                            container.Row(row =>
                            {
                                // Company info (left)
                                row.RelativeColumn(3).Component(new TextComponent($"{invoice.Company.Name}")
                                    .FontSize(18)
                                    .Bold());

                                // Invoice info (right)
                                row.RelativeColumn(2).Component(new TextComponent($"INVOICE #{invoice.InvoiceNumber}")
                                    .AlignRight()
                                    .FontSize(16)
                                    .Bold());
                            });

                            container.PaddingVertical(10).BorderBottom(1).BorderColor(Colors.Grey.Medium);
                            
                            container.Padding(10);
                            
                            container.Row(row =>
                            {
                                // From section
                                row.RelativeColumn().Component(new ColumnComponent()
                                    .Title("FROM:")
                                    .Item($"{invoice.Company.Name}")
                                    .Item($"{invoice.Company.Address}")
                                    .Item($"Tax ID: {invoice.Company.TaxNumber}")
                                    .Item($"{invoice.Company.Email}")
                                    .Item($"{invoice.Company.Phone}"));

                                // To section
                                row.RelativeColumn().Component(new ColumnComponent()
                                    .Title("TO:")
                                    .Item($"{invoice.Customer.Name}")
                                    .Item($"{invoice.Customer.Address}")
                                    .Item($"Tax Number: {invoice.Customer.TaxNumber}")
                                    .Item($"{invoice.Customer.Email}")
                                    .Item($"{invoice.Customer.Phone}"));

                                // Invoice details section
                                row.RelativeColumn().Component(new ColumnComponent()
                                    .Title("INVOICE DETAILS:")
                                    .Item($"Invoice #: {invoice.InvoiceNumber}")
                                    .Item($"Date: {invoice.InvoiceDate:yyyy-MM-dd}")
                                    .Item($"Due Date: {invoice.DueDate:yyyy-MM-dd}")
                                    .Item($"Status: {invoice.Status}"));
                            });
                        }

                        void ComposeContent(IContainer container, Invoice invoice)
                        {
                            container.PaddingVertical(20);
                            
                            // Items table
                            container.Table(table =>
                            {
                                // Define columns
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(1);    // #
                                    columns.RelativeColumn(4);    // Item
                                    columns.RelativeColumn(2);    // Quantity
                                    columns.RelativeColumn(2);    // Unit Price
                                    columns.RelativeColumn(2);    // Total
                                });

                                // Header row
                                table.Header(header =>
                                {
                                    header.Cell().Element(CellStyle).Text("#").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Item").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Quantity").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Unit Price").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Total").SemiBold();
                                    
                                    static IContainer CellStyle(IContainer container)
                                    {
                                        return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                                    }
                                });

                                // Add items
                                var invoiceItemsArray = invoice.InvoiceItems.ToArray();
                                for (int i = 0; i < invoiceItemsArray.Length; i++)
                                {
                                    var item = invoiceItemsArray[i];
                                    table.Cell().Element(CellStyle).Text(i + 1);
                                    table.Cell().Element(CellStyle).Text(item.Product?.Name ?? "Unknown Product");
                                    table.Cell().Element(CellStyle).Text(item.Quantity.ToString());
                                    table.Cell().Element(CellStyle).Text($"{item.UnitPrice:C}");
                                    table.Cell().Element(CellStyle).Text($"{item.Total:C}");
                                    
                                    static IContainer CellStyle(IContainer container)
                                    {
                                        return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                                    }
                                }
                            });

                            // Summary
                            container.PaddingTop(15);
                            container.AlignRight().Width(200).Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                // Subtotal row
                                table.Cell().Element(CellStyle).Text("Subtotal:").SemiBold();
                                table.Cell().Element(CellStyle).AlignRight().Text($"{invoice.Subtotal:C}");

                                // Tax row
                                table.Cell().Element(CellStyle).Text("Tax:").SemiBold();
                                table.Cell().Element(CellStyle).AlignRight().Text($"{invoice.TaxAmount:C}");

                                // Grand total
                                table.Cell().Element(CellStyleTotal).Text("Total:").SemiBold();
                                table.Cell().Element(CellStyleTotal).AlignRight().Text($"{invoice.Total:C}").FontSize(12).Bold();
                                
                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                                }
                                
                                static IContainer CellStyleTotal(IContainer container)
                                {
                                    return container.BorderBottom(1).BorderColor(Colors.Black).PaddingVertical(5);
                                }
                            });

                            // Notes section
                            if (!string.IsNullOrEmpty(invoice.Notes))
                            {
                                container.PaddingTop(20);
                                container.Background(Colors.Grey.Lighten5).Padding(10).Element(e => 
                                {
                                    e.Text("Notes:").SemiBold();
                                    e.PaddingTop(5).Text(invoice.Notes);
                                });
                            }

                            // Payment information
                            container.PaddingTop(20);
                            container.Background(Colors.Blue.Lighten5).Padding(10).Element(e =>
                            {
                                e.Text("Payment Information:").SemiBold();
                                
                                var bankDetails = invoice.Company.BankDetails != null ? invoice.Company.BankDetails.ToArray() : null;
                                var companyBankDetail = bankDetails != null && bankDetails.Length > 0 ? bankDetails[0] : null;
                                if (companyBankDetail != null)
                                {
                                    e.PaddingTop(5).Text($"Bank: {companyBankDetail.BankName}");
                                    e.Text($"Account Number: {companyBankDetail.AccountNumber}");
                                    e.Text($"IBAN: {companyBankDetail.IBAN}");
                                }
                                else
                                {
                                    e.PaddingTop(5).Text("Please contact us for payment details.");
                                }
                            });
                        }

                        void ComposeFooter(IContainer container)
                        {
                            container.AlignCenter().Text(text =>
                            {
                                text.Span("Thank you for your business!").FontSize(12).Bold();
                                text.Span("\n");
                                text.Span($"Generated on: {DateTime.Now:yyyy-MM-dd HH:mm:ss}").FontSize(9);
                                text.Span("\n");
                                text.Span($"Page ").FontSize(9);
                                text.CurrentPageNumber().FontSize(9);
                                text.Span(" of ").FontSize(9);
                                text.TotalPages().FontSize(9);
                            });
                        }
                    });
                });

                using var stream = new MemoryStream();
                document.GeneratePdf(stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating invoice PDF for ID: {invoiceId}");
                throw;
            }
        }

        public async Task<byte[]> GenerateOrderPdfAsync(int orderId)
        {
            try
            {
                _logger.LogInformation($"Generating order PDF for Order ID: {orderId}");

                // Get the order with all related data
                var order = await _context.Orders
                    .Include(o => o.Company)
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                    .FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);

                if (order == null)
                {
                    _logger.LogWarning($"Order not found for ID: {orderId}");
                    throw new Exception($"Order not found for ID: {orderId}");
                }

                // Generate PDF using QuestPDF library
                var document = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        // Page setup
                        page.Size(PageSizes.A4);
                        page.Margin(50);
                        page.DefaultTextStyle(x => x.FontSize(10));

                        // Header
                        page.Header().Element(ComposeHeader);

                        // Content
                        page.Content().Element(container => ComposeContent(container, order));

                        // Footer
                        page.Footer().Element(ComposeFooter);

                        // Local functions for PDF composition
                        void ComposeHeader(IContainer container)
                        {
                            container.Row(row =>
                            {
                                // Company info (left)
                                row.RelativeColumn(3).Component(new TextComponent($"{order.Company.Name}")
                                    .FontSize(18)
                                    .Bold());

                                // Order info (right)
                                row.RelativeColumn(2).Component(new TextComponent($"ORDER #{order.OrderNumber}")
                                    .AlignRight()
                                    .FontSize(16)
                                    .Bold());
                            });

                            container.PaddingVertical(10).BorderBottom(1).BorderColor(Colors.Grey.Medium);
                            
                            container.Padding(10);
                            
                            container.Row(row =>
                            {
                                // From section
                                row.RelativeColumn().Component(new ColumnComponent()
                                    .Title("FROM:")
                                    .Item($"{order.Company.Name}")
                                    .Item($"{order.Company.Address}")
                                    .Item($"Tax ID: {order.Company.TaxNumber}")
                                    .Item($"{order.Company.Email}")
                                    .Item($"{order.Company.Phone}"));

                                // To section
                                row.RelativeColumn().Component(new ColumnComponent()
                                    .Title("TO:")
                                    .Item($"{order.Customer.Name}")
                                    .Item($"{order.Customer.Address}")
                                    .Item($"Tax Number: {order.Customer.TaxNumber}")
                                    .Item($"{order.Customer.Email}")
                                    .Item($"{order.Customer.Phone}"));

                                // Order details section
                                row.RelativeColumn().Component(new ColumnComponent()
                                    .Title("ORDER DETAILS:")
                                    .Item($"Order #: {order.OrderNumber}")
                                    .Item($"Date: {order.OrderDate:yyyy-MM-dd}")
                                    .Item($"Due Date: {order.DueDate:yyyy-MM-dd}")
                                    .Item($"Status: {order.Status}"));
                            });
                        }

                        void ComposeContent(IContainer container, Order order)
                        {
                            container.PaddingVertical(20);
                            
                            // Items table
                            container.Table(table =>
                            {
                                // Define columns
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(1);    // #
                                    columns.RelativeColumn(4);    // Product
                                    columns.RelativeColumn(2);    // Quantity
                                    columns.RelativeColumn(2);    // Unit Price
                                    columns.RelativeColumn(2);    // Total
                                });

                                // Header row
                                table.Header(header =>
                                {
                                    header.Cell().Element(CellStyle).Text("#").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Product").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Quantity").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Unit Price").SemiBold();
                                    header.Cell().Element(CellStyle).Text("Total").SemiBold();
                                    
                                    static IContainer CellStyle(IContainer container)
                                    {
                                        return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                                    }
                                });

                                // Add items
                                var orderItemsArray = order.OrderItems.ToArray();
                                for (int i = 0; i < orderItemsArray.Length; i++)
                                {
                                    var item = orderItemsArray[i];
                                    table.Cell().Element(CellStyle).Text(i + 1);
                                    table.Cell().Element(CellStyle).Text(item.Product?.Name ?? "Unknown Product");
                                    table.Cell().Element(CellStyle).Text(item.Quantity.ToString());
                                    table.Cell().Element(CellStyle).Text($"{item.UnitPrice:C}");
                                    table.Cell().Element(CellStyle).Text($"{item.Total:C}");
                                    
                                    static IContainer CellStyle(IContainer container)
                                    {
                                        return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                                    }
                                }
                            });

                            // Summary
                            container.PaddingTop(15);
                            container.AlignRight().Width(200).Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                // Subtotal row
                                table.Cell().Element(CellStyle).Text("Subtotal:").SemiBold();
                                table.Cell().Element(CellStyle).AlignRight().Text($"{order.SubTotal:C}");

                                // Tax row
                                table.Cell().Element(CellStyle).Text("Tax:").SemiBold();
                                table.Cell().Element(CellStyle).AlignRight().Text($"{order.TaxAmount:C}");

                                // Shipping row
                                table.Cell().Element(CellStyle).Text("Shipping:").SemiBold();
                                table.Cell().Element(CellStyle).AlignRight().Text($"{order.ShippingCost:C}");

                                // Grand total
                                table.Cell().Element(CellStyleTotal).Text("Total:").SemiBold();
                                table.Cell().Element(CellStyleTotal).AlignRight().Text($"{order.Total:C}").FontSize(12).Bold();
                                
                                static IContainer CellStyle(IContainer container)
                                {
                                    return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                                }
                                
                                static IContainer CellStyleTotal(IContainer container)
                                {
                                    return container.BorderBottom(1).BorderColor(Colors.Black).PaddingVertical(5);
                                }
                            });

                            // Notes section
                            if (!string.IsNullOrEmpty(order.Notes))
                            {
                                container.PaddingTop(20);
                                container.Background(Colors.Grey.Lighten5).Padding(10).Element(e => 
                                {
                                    e.Text("Notes:").SemiBold();
                                    e.PaddingTop(5).Text(order.Notes);
                                });
                            }
                        }

                        void ComposeFooter(IContainer container)
                        {
                            container.AlignCenter().Text(text =>
                            {
                                text.Span("Thank you for your order!").FontSize(12).Bold();
                                text.Span("\n");
                                text.Span($"Generated on: {DateTime.Now:yyyy-MM-dd HH:mm:ss}").FontSize(9);
                                text.Span("\n");
                                text.Span($"Page ").FontSize(9);
                                text.CurrentPageNumber().FontSize(9);
                                text.Span(" of ").FontSize(9);
                                text.TotalPages().FontSize(9);
                            });
                        }
                    });
                });

                using var stream = new MemoryStream();
                document.GeneratePdf(stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating order PDF for ID: {orderId}");
                throw;
            }
        }

        public async Task<bool> SendInvoiceWithPdfAsync(int invoiceId)
        {
            try
            {
                _logger.LogInformation($"Sending invoice with PDF attachment for Invoice ID: {invoiceId}");

                // 1. Generate the PDF first
                var pdfBytes = await GenerateInvoicePdfAsync(invoiceId);
                
                // Get the invoice basic info
                var invoice = await _context.Invoices
                    .Include(i => i.Customer)
                    .Include(i => i.Company)
                    .FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted);
                
                if (invoice == null)
                {
                    _logger.LogWarning($"Invoice not found for ID: {invoiceId}");
                    return false;
                }

                // 2. Save the PDF to a temporary file
                var tempFile = Path.Combine(Path.GetTempPath(), $"Invoice_{invoice.InvoiceNumber}.pdf");
                await File.WriteAllBytesAsync(tempFile, pdfBytes);
                
                // 3. Send the email with the PDF attachment
                var to = invoice.Customer.Email;
                var subject = $"Invoice #{invoice.InvoiceNumber} from {invoice.Company.Name}";
                
                // Create HTML email body
                var body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; }}
                        .header {{ background-color: #f5f5f5; padding: 20px; text-align: center; }}
                        .content {{ padding: 20px; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #777; text-align: center; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Invoice #{invoice.InvoiceNumber}</h2>
                        </div>
                        <div class='content'>
                            <p>Dear {invoice.Customer.Name},</p>
                            
                            <p>Please find attached your invoice #{invoice.InvoiceNumber} for the amount of {invoice.Total:C}.</p>
                            
                            <p><strong>Invoice Details:</strong><br>
                            Invoice Number: {invoice.InvoiceNumber}<br>
                            Date: {invoice.InvoiceDate:yyyy-MM-dd}<br>
                            Due Date: {invoice.DueDate:yyyy-MM-dd}<br>
                            Amount Due: {invoice.Total:C}</p>
                            
                            <p>For any questions regarding this invoice, please don't hesitate to contact us.</p>
                            
                            <p>Best regards,<br>
                            {invoice.Company.Name} Team</p>
                        </div>
                        <div class='footer'>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>";
                
                var result = await _emailService.SendEmailAsync(
                    to, 
                    subject, 
                    body, 
                    invoice.CompanyId, 
                    invoice.CustomerId,
                    new List<string> { tempFile });
                
                // 4. Clean up the temporary file
                if (File.Exists(tempFile))
                {
                    File.Delete(tempFile);
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending invoice with PDF for Invoice ID: {invoiceId}");
                return false;
            }
        }

        public async Task<bool> SendOrderConfirmationWithPdfAsync(int orderId)
        {
            try
            {
                _logger.LogInformation($"Sending order confirmation with PDF attachment for Order ID: {orderId}");

                // 1. Generate the PDF first
                var pdfBytes = await GenerateOrderPdfAsync(orderId);
                
                // Get the order basic info
                var order = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.Company)
                    .FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);
                
                if (order == null)
                {
                    _logger.LogWarning($"Order not found for ID: {orderId}");
                    return false;
                }

                // 2. Save the PDF to a temporary file
                var tempFile = Path.Combine(Path.GetTempPath(), $"Order_{order.OrderNumber}.pdf");
                await File.WriteAllBytesAsync(tempFile, pdfBytes);
                
                // 3. Send the email with the PDF attachment
                var to = order.Customer.Email;
                var subject = $"Order Confirmation #{order.OrderNumber} from {order.Company.Name}";
                
                // Create HTML email body
                var body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ max-width: 600px; margin: 0 auto; }}
                        .header {{ background-color: #f5f5f5; padding: 20px; text-align: center; }}
                        .content {{ padding: 20px; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #777; text-align: center; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Order Confirmation #{order.OrderNumber}</h2>
                        </div>
                        <div class='content'>
                            <p>Dear {order.Customer.Name},</p>
                            
                            <p>Thank you for your order. We are pleased to confirm that your order has been received and is being processed.</p>
                            
                            <p><strong>Order Details:</strong><br>
                            Order Number: {order.OrderNumber}<br>
                            Date: {order.OrderDate:yyyy-MM-dd}<br>
                            Status: {order.Status}<br>
                            Total Amount: {order.Total:C}</p>
                            
                            <p>Please find attached a copy of your order confirmation for your records.</p>
                            
                            <p>If you have any questions about your order, please contact us.</p>
                            
                            <p>Best regards,<br>
                            {order.Company.Name} Team</p>
                        </div>
                        <div class='footer'>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>";
                
                var result = await _emailService.SendEmailAsync(
                    to, 
                    subject, 
                    body, 
                    order.CompanyId, 
                    order.CustomerId,
                    new List<string> { tempFile });
                
                // 4. Clean up the temporary file
                if (File.Exists(tempFile))
                {
                    File.Delete(tempFile);
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending order confirmation with PDF for Order ID: {orderId}");
                return false;
            }
        }
    }

    // Helper Components for PDF generation
    public class TextComponent : IComponent
    {
        private string _text;
        private float _fontSize = 10;
        private bool _bold = false;
        private TextStyle _textStyle = TextStyle.Normal;
        private bool _alignRight = false;

        public TextComponent(string text)
        {
            _text = text;
        }

        public TextComponent FontSize(float size)
        {
            _fontSize = size;
            return this;
        }

        public TextComponent Bold()
        {
            _bold = true;
            return this;
        }

        public TextComponent SemiBold()
        {
            _textStyle = TextStyle.SemiBold;
            return this;
        }

        public TextComponent AlignRight()
        {
            _alignRight = true;
            return this;
        }

        public void Compose(IContainer container)
        {
            var textSpan = container.Text(_text);
            
            if (_alignRight)
                textSpan.AlignRight();
                
            textSpan.FontSize(_fontSize);
            
            if (_bold)
                textSpan.Bold();
                
            if (_textStyle == TextStyle.SemiBold)
                textSpan.SemiBold();
        }
    }

    public class ColumnComponent : IComponent
    {
        private string _title;
        private List<string> _items = new List<string>();

        public ColumnComponent Title(string title)
        {
            _title = title;
            return this;
        }

        public ColumnComponent Item(string item)
        {
            _items.Add(item);
            return this;
        }

        public void Compose(IContainer container)
        {
            container.Column(column =>
            {
                // Title
                column.Item().Text(_title).Bold();
                
                // Add spacing
                column.Item().Height(5);
                
                // Items
                foreach (var item in _items)
                {
                    column.Item().Text(item);
                }
            });
        }
    }

    public enum TextStyle
    {
        Normal,
        SemiBold,
        Bold
    }
} 