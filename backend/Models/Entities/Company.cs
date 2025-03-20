using System.ComponentModel.DataAnnotations.Schema;

namespace TrackMate.API.Models.Entities
{
    public class Company : BaseEntity
    {
        [Column("CompanyName")]
        public string Name { get; set; }

        [Column("TaxID")]
        public string TaxId { get; set; }

        public string Address { get; set; }

        [Column("PhoneNo")]
        public string Phone { get; set; }

        public DateTime CreatedDate { get; set; }

        // Navigation Properties
        public virtual ICollection<User> Users { get; set; }
        public virtual ICollection<Customer> Customers { get; set; }
        public virtual ICollection<Product> Products { get; set; }
        public virtual ICollection<Order> Orders { get; set; }
        public virtual ICollection<CompanyBankDetail> BankDetails { get; set; }
        public virtual ICollection<EmailLog> EmailLogs { get; set; }
    }
}
