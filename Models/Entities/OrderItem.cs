namespace TrackMate.API.Models.Entities
{
    public class OrderItem : BaseEntity
    {
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Total { get; set; }

        // Navigation Properties
        public virtual Order Order { get; set; }
        public virtual Product Product { get; set; }
    }
}
