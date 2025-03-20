namespace TrackMate.API.Models.Entities
{
    public class Product : BaseEntity
    {
        public int CompanyId { get; set; }
        public string ProductName { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public decimal Weight { get; set; }
        public int Quantity { get; set; }
        public DateTime AddDate { get; set; }

        // Navigation Properties
        public virtual Company Company { get; set; }
        public virtual ICollection<OrderItem> OrderItems { get; set; }
        public virtual ICollection<InvoiceItem> InvoiceItems { get; set; }
    }
}
