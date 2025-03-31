namespace TrackMate.API.Models.Entities
{
    public class Invoice : BaseEntity
    {
        public int CompanyId { get; set; }
        public string InvoiceNo { get; set; }
        public DateTime InvoiceDate { get; set; }
        public int CustomerId { get; set; }
        public int? OrderId { get; set; }
        public int BankId { get; set; }
        public decimal Subtotal { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal Total { get; set; }
        public string Currency { get; set; }
        public int CreatedBy { get; set; }

        // Navigation Properties
        public virtual Company Company { get; set; }
        public virtual Customer Customer { get; set; }
        public virtual Order Order { get; set; }
        public virtual CompanyBankDetail Bank { get; set; }
        public virtual User CreatedByUser { get; set; }
        public virtual ICollection<InvoiceItem> InvoiceItems { get; set; }
    }
}
