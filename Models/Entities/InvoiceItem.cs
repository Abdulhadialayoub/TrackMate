namespace TrackMate.API.Models.Entities
{
    public class InvoiceItem : BaseEntity
    {
        public int InvoiceId { get; set; }
        public int ProductId { get; set; }
        public string Description { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Total { get; set; }

        // Navigation Properties
        public virtual Invoice Invoice { get; set; }
        public virtual Product Product { get; set; }
    }
}
