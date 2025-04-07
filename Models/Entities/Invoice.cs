using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrackMate.API.Models.Entities
{
    public class Invoice : BaseEntity
    {
        public new int CompanyId { get; set; }
        public string InvoiceNumber { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public int CustomerId { get; set; }
        public int? OrderId { get; set; }
        public int? BankDetailsId { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal Total { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public DateTime? PaidDate { get; set; }
        public new string CreatedBy { get; set; }
        
        // PDF ile ilgili alanlar
        public byte[]? PdfContent { get; set; }
        public string? PdfFilePath { get; set; }
        public DateTime? PdfGeneratedDate { get; set; }

        // Navigation Properties
        public new virtual Company Company { get; set; }
        public virtual Customer Customer { get; set; }
        public virtual Order Order { get; set; }
        
        [ForeignKey("BankDetailsId")]
        public virtual CompanyBankDetail Bank { get; set; }
        public virtual User CreatedByUser { get; set; }
        public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new HashSet<InvoiceItem>();
    }
}
