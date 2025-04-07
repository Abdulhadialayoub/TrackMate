using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Interfaces
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends an email and logs it to the database
        /// </summary>
        Task<bool> SendEmailAsync(string to, string subject, string body, int companyId, int? customerId = null, List<string> attachments = null);
        
        /// <summary>
        /// Sends an order confirmation email to the customer
        /// </summary>
        Task<bool> SendOrderConfirmationAsync(int orderId);
        
        /// <summary>
        /// Sends an invoice email to the customer
        /// </summary>
        Task<bool> SendInvoiceAsync(int invoiceId);

        /// <summary>
        /// Gets email logs by company ID
        /// </summary>
        Task<bool> GetEmailLogsByCompanyIdAsync(int companyId);

        /// <summary>
        /// Creates an email log
        /// </summary>
        Task<bool> CreateEmailLogAsync(EmailLog emailLog);
    }
} 