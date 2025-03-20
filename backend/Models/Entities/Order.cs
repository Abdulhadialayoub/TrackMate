namespace TrackMate.API.Models.Entities
{
    public class Order : BaseEntity
    {
        public int CompanyId { get; set; }
        public int CustomerId { get; set; }
        public DateTime OrderDate { get; set; }
        public string Status { get; set; }
        public decimal Total { get; set; }
        public int CreatedBy { get; set; }

        // Navigation Properties
        public virtual Company Company { get; set; }
        public virtual Customer Customer { get; set; }
        public virtual User CreatedByUser { get; set; }
        public virtual ICollection<OrderItem> OrderItems { get; set; }
        public virtual Invoice Invoice { get; set; }
    }
}
