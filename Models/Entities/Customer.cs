namespace TrackMate.API.Models.Entities
{
    public class Customer : BaseEntity
    {
        public int CompanyId { get; set; }
        public string Name { get; set; }
        public string PhoneNo { get; set; }
        public string Address { get; set; }

        // Navigation Properties
        public virtual Company Company { get; set; }
        public virtual ICollection<Order> Orders { get; set; }
        public virtual ICollection<Invoice> Invoices { get; set; }
        public virtual ICollection<EmailLog> EmailLogs { get; set; }
    }
}
