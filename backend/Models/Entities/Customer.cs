using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.Entities
{
    public class Customer : BaseEntity
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        [StringLength(20)]
        public string Phone { get; set; }

        [Required]
        [StringLength(200)]
        public string Address { get; set; }

        [StringLength(50)]
        public string TaxNumber { get; set; }

        [StringLength(100)]
        public string TaxOffice { get; set; }

        [Required]
        public CustomerStatus Status { get; set; }

        public string Notes { get; set; }

        public virtual ICollection<Order> Orders { get; set; }
        public virtual ICollection<Invoice> Invoices { get; set; }
        public virtual ICollection<EmailLog> EmailLogs { get; set; }
    }
}
