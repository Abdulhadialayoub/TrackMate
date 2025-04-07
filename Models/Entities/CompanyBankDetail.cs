using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrackMate.API.Models.Entities
{
    public class CompanyBankDetail : BaseEntity
    {
        public new int CompanyId { get; set; }
        public new virtual Company Company { get; set; }

        [Required]
        public string BankName { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string IBAN { get; set; } = string.Empty;
        public string SWIFT { get; set; }
        public string Currency { get; set; }
        public new bool IsActive { get; set; }
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
