using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Collections.Generic;
using TrackMate.API.Data;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.DTOs;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly IEmailLogService _emailLogService;
        private readonly TrackMateDbContext _context;
        private readonly IMapper _mapper;

        public EmailService(
            IConfiguration configuration,
            ILogger<EmailService> logger,
            IEmailLogService emailLogService,
            TrackMateDbContext context,
            IMapper mapper)
        {
            _configuration = configuration;
            _logger = logger;
            _emailLogService = emailLogService;
            _context = context;
            _mapper = mapper;
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string body, int companyId, int? customerId = null, List<string> attachments = null)
        {
            try
            {
                _logger.LogInformation($"Sending email to {to} with subject '{subject}'");

                var smtpSettings = _configuration.GetSection("SmtpSettings");
                var host = smtpSettings["Host"];
                var port = int.Parse(smtpSettings["Port"]);
                var enableSsl = bool.Parse(smtpSettings["EnableSsl"]);
                var username = smtpSettings["Username"];
                var password = smtpSettings["Password"];
                var from = smtpSettings["From"];

                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = enableSsl,
                    Credentials = new NetworkCredential(username, password)
                };

                using var message = new MailMessage(from, to)
                {
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };

                // Add attachments if any
                if (attachments != null)
                {
                    foreach (var attachment in attachments)
                    {
                        if (File.Exists(attachment))
                        {
                            message.Attachments.Add(new Attachment(attachment));
                        }
                        else
                        {
                            _logger.LogWarning($"Attachment file not found: {attachment}");
                        }
                    }
                }

                // Send the email
                await client.SendMailAsync(message);

                // Log the email to database
                await LogEmailAsync(companyId, customerId, to, subject, body, true, null);

                _logger.LogInformation($"Email sent successfully to {to}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending email to {to}");
                
                // Log the failed email to database
                await LogEmailAsync(companyId, customerId, to, subject, body, false, ex.Message);
                
                return false;
            }
        }

        private async Task<EmailLogDto> LogEmailAsync(int companyId, int? customerId, string recipient, string subject, string body, bool isSuccess, string errorMessage)
        {
            try
            {
                var emailLog = new CreateEmailLogDto
                {
                    CompanyId = companyId,
                    CustomerId = customerId,
                    To = recipient,
                    Subject = subject,
                    Body = body, 
                    SentDate = DateTime.UtcNow,
                    Status = isSuccess ? EmailStatus.Sent : EmailStatus.Failed,
                    ErrorMessage = errorMessage,
                    CreatedBy = "System"
                };

                return await _emailLogService.CreateEmailLogAsync(emailLog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging email");
                return null;
            }
        }
        
        public async Task<bool> SendOrderConfirmationAsync(int orderId)
        {
            try
            {
                _logger.LogInformation($"Sending order confirmation for Order ID: {orderId}");
                
                // Get the order with customer and items
                var order = await _context.Orders
                    .Include(o => o.Customer)
                    .Include(o => o.OrderItems)
                        .ThenInclude(i => i.Product)
                    .Include(o => o.Company)
                    .FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);
                
                if (order == null || order.Customer == null)
                {
                    _logger.LogWarning($"Order not found or no customer associated with Order ID: {orderId}");
                    return false;
                }
                
                var to = order.Customer.Email;
                var subject = $"Order Confirmation - {order.OrderNumber}";
                
                // Create HTML email body
                var body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; }}
                        .header {{ background-color: #f5f5f5; padding: 20px; text-align: center; }}
                        .container {{ padding: 20px; }}
                        table {{ width: 100%; border-collapse: collapse; }}
                        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                        th {{ background-color: #f2f2f2; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #777; }}
                    </style>
                </head>
                <body>
                    <div class='header'>
                        <h2>Order Confirmation</h2>
                        <p>Order #: {order.OrderNumber}</p>
                    </div>
                    <div class='container'>
                        <p>Dear {order.Customer.Name},</p>
                        <p>Thank you for your order. We are pleased to confirm that your order has been received and is being processed.</p>
                        
                        <h3>Order Details:</h3>
                        <p>Order Date: {order.OrderDate:yyyy-MM-dd}<br>
                        Due Date: {order.DueDate:yyyy-MM-dd}</p>
                        
                        <h3>Order Items:</h3>
                        <table>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>";
                
                // Add order items to the table
                foreach (var item in order.OrderItems)
                {
                    body += $@"
                            <tr>
                                <td>{item.Product?.Name ?? "Unknown Product"}</td>
                                <td>{item.Quantity}</td>
                                <td>{item.UnitPrice:C}</td>
                                <td>{item.Total:C}</td>
                            </tr>";
                }
                
                body += $@"
                        </table>
                        
                        <h3>Order Summary:</h3>
                        <p>
                            Subtotal: {order.SubTotal:C}<br>
                            Tax: {order.TaxAmount:C}<br>
                            Shipping: {order.ShippingCost:C}<br>
                            <strong>Total: {order.Total:C}</strong>
                        </p>
                        
                        <p>If you have any questions about your order, please contact us.</p>
                        
                        <p>Best regards,<br>
                        {order.Company?.Name ?? "Our Company"} Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </body>
                </html>";
                
                // Send the email
                return await SendEmailAsync(to, subject, body, order.CompanyId, order.CustomerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending order confirmation for Order ID: {orderId}");
                return false;
            }
        }
        
        public async Task<bool> SendInvoiceAsync(int invoiceId)
        {
            try
            {
                _logger.LogInformation($"Sending invoice email for Invoice ID: {invoiceId}");
                
                // Get the invoice with customer and items
                var invoice = await _context.Invoices
                    .Include(i => i.Customer)
                    .Include(i => i.InvoiceItems)
                        .ThenInclude(ii => ii.Product)
                    .Include(i => i.Company)
                    .FirstOrDefaultAsync(i => i.Id == invoiceId && !i.IsDeleted);
                
                if (invoice == null || invoice.Customer == null)
                {
                    _logger.LogWarning($"Invoice not found or no customer associated with Invoice ID: {invoiceId}");
                    return false;
                }
                
                var to = invoice.Customer.Email;
                var subject = $"Invoice - {invoice.InvoiceNumber}";
                
                // Create HTML email body
                var body = $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; }}
                        .header {{ background-color: #f5f5f5; padding: 20px; text-align: center; }}
                        .container {{ padding: 20px; }}
                        table {{ width: 100%; border-collapse: collapse; }}
                        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                        th {{ background-color: #f2f2f2; }}
                        .footer {{ margin-top: 20px; font-size: 12px; color: #777; }}
                    </style>
                </head>
                <body>
                    <div class='header'>
                        <h2>Invoice</h2>
                        <p>Invoice #: {invoice.InvoiceNumber}</p>
                    </div>
                    <div class='container'>
                        <p>Dear {invoice.Customer.Name},</p>
                        <p>Please find your invoice details below.</p>
                        
                        <h3>Invoice Details:</h3>
                        <p>Invoice Date: {invoice.InvoiceDate:yyyy-MM-dd}<br>
                        Due Date: {invoice.DueDate:yyyy-MM-dd}</p>
                        
                        <h3>Invoice Items:</h3>
                        <table>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>";
                
                // Add invoice items to the table
                foreach (var item in invoice.InvoiceItems)
                {
                    body += $@"
                            <tr>
                                <td>{item.Product?.Name ?? "Unknown Product"}</td>
                                <td>{item.Quantity}</td>
                                <td>{item.UnitPrice:C}</td>
                                <td>{item.Total:C}</td>
                            </tr>";
                }
                
                body += $@"
                        </table>
                        
                        <h3>Invoice Summary:</h3>
                        <p>
                            Subtotal: {invoice.Subtotal:C}<br>
                            Tax: {invoice.TaxAmount:C}<br>
                            <strong>Total Amount: {invoice.Total:C}</strong>
                        </p>
                        
                        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
                        
                        <p>Best regards,<br>
                        {invoice.Company?.Name ?? "Our Company"} Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </body>
                </html>";
                
                // Send the email
                return await SendEmailAsync(to, subject, body, invoice.CompanyId, invoice.CustomerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending invoice email for Invoice ID: {invoiceId}");
                return false;
            }
        }

        public async Task<bool> GetEmailLogsByCompanyIdAsync(int companyId)
        {
            await _emailLogService.GetEmailLogsByCompanyIdAsync(companyId);
            return true;
        }

        public async Task<bool> CreateEmailLogAsync(EmailLog emailLog)
        {
            await _emailLogService.CreateEmailLogAsync(emailLog);
            return true;
        }
    }
} 