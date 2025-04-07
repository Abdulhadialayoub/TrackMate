using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Interfaces
{
    public interface IPdfService
    {
        /// <summary>
        /// Generates a PDF file for an invoice and returns the file as a byte array
        /// </summary>
        /// <param name="invoice">The invoice entity</param>
        /// <returns>Byte array containing the PDF document</returns>
        Task<byte[]> GenerateInvoicePdfAsync(Invoice invoice);

        /// <summary>
        /// Generates a PDF file for an invoice and returns the file as a byte array
        /// </summary>
        /// <param name="invoiceId">The ID of the invoice to generate PDF for</param>
        /// <returns>Byte array containing the PDF document</returns>
        Task<byte[]> GenerateInvoicePdfAsync(int invoiceId);

        /// <summary>
        /// Saves an invoice PDF to storage and returns the file path or url
        /// </summary>
        /// <param name="invoiceId">The ID of the invoice to generate and save PDF for</param>
        /// <returns>Path or URL to the saved PDF file</returns>
        Task<string> SaveInvoicePdfAsync(int invoiceId);
        
        /// <summary>
        /// Saves an invoice PDF to database and file system
        /// </summary>
        /// <param name="invoiceId">The ID of the invoice to generate and save PDF for</param>
        /// <param name="saveToDatabase">Whether to save the PDF content to the database</param>
        /// <param name="saveToFileSystem">Whether to save the PDF to the file system</param>
        /// <returns>Updated invoice with PDF information</returns>
        Task<Invoice> SavePdfToDatabaseAsync(int invoiceId, bool saveToDatabase = true, bool saveToFileSystem = true);
    }
} 