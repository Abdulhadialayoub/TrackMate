using System;
using System.ComponentModel.DataAnnotations;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.DTOs
{
    public class CustomerDto : BaseDto
    {
        [Required]
        public new int CompanyId { get; set; }

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

        public IEnumerable<OrderDto> Orders { get; set; }

        public IEnumerable<InvoiceDto> Invoices { get; set; }

        public new bool IsActive { get; set; }
        public int OrderCount { get; set; }
        public int InvoiceCount { get; set; }
        public int EmailLogCount { get; set; }
        public new DateTime CreatedAt { get; set; }
        public new string CreatedBy { get; set; } = string.Empty;
        public new DateTime? UpdatedAt { get; set; }
        public new string? UpdatedBy { get; set; }
        public CompanyDto Company { get; set; }
    }

    public class CreateCustomerDto
    {
        [Required]
        public int CompanyId { get; set; }

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
        public CustomerStatus Status { get; set; } = CustomerStatus.Active;

        public string Notes { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateCustomerDto
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
        
        public CustomerStatus Status { get; set; }

        public string Notes { get; set; }
        
        public string UpdatedBy { get; set; } = string.Empty;
    }

    public class UpdateCustomerStatusDto
    {
        [Required]
        public CustomerStatus Status { get; set; }
    }
} 