using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Models.Entities
{
    public class Company : BaseEntity
    {
        [Required]
        [StringLength(100)]
        [Column("CompanyName")]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        [Column("TaxID")]
        public string TaxId { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Address { get; set; }

        [Required]
        [StringLength(20)]
        [Column("PhoneNo")]
        public string Phone { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [StringLength(100)]
        public string Website { get; set; }

        public DateTime CreatedDate { get; set; }

        [Required]
        [StringLength(20)]
        public string TaxNumber { get; set; }

        [StringLength(100)]
        public string TaxOffice { get; set; } = string.Empty;

        // Navigation Properties
        public virtual ICollection<User> Users { get; set; } = new HashSet<User>();
        public virtual ICollection<Customer> Customers { get; set; } = new HashSet<Customer>();
        public virtual ICollection<Product> Products { get; set; } = new HashSet<Product>();
        public virtual ICollection<Order> Orders { get; set; } = new HashSet<Order>();
        public virtual ICollection<EmailLog> EmailLogs { get; set; } = new List<EmailLog>();
        public virtual ICollection<Invoice> Invoices { get; set; } = new HashSet<Invoice>();
        public virtual ICollection<Category> Categories { get; set; } = new HashSet<Category>();

        public Company()
        {
            Users = new HashSet<User>();
            Customers = new HashSet<Customer>();
            Products = new HashSet<Product>();
            Orders = new HashSet<Order>();
            Invoices = new HashSet<Invoice>();
        }
    }
}
