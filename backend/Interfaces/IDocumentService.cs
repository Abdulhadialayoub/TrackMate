using System.Collections.Generic;
using System.Threading.Tasks;

namespace TrackMate.API.Interfaces
{
    public interface IDocumentService
    {
        /// <summary>
        /// Generates a PDF document for an invoice
        /// </summary>
        /// <param name="invoiceId">The ID of the invoice</param>
        /// <returns>Byte array of the PDF document</returns>
        Task<byte[]> GenerateInvoicePdfAsync(int invoiceId);
        
        /// <summary>
        /// Generates a PDF document for an order
        /// </summary>
        /// <param name="orderId">The ID of the order</param>
        /// <returns>Byte array of the PDF document</returns>
        Task<byte[]> GenerateOrderPdfAsync(int orderId);
        
        /// <summary>
        /// Sends an invoice with its PDF document as an attachment
        /// </summary>
        /// <param name="invoiceId">The ID of the invoice</param>
        /// <returns>True if the email was sent successfully, false otherwise</returns>
        Task<bool> SendInvoiceWithPdfAsync(int invoiceId);
        
        /// <summary>
        /// Sends an order confirmation with its PDF document as an attachment
        /// </summary>
        /// <param name="orderId">The ID of the order</param>
        /// <returns>True if the email was sent successfully, false otherwise</returns>
        Task<bool> SendOrderConfirmationWithPdfAsync(int orderId);
    }
} 