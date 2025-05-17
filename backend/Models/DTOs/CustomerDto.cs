using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TrackMate.API.Models.Enums;
using System.Text.Json.Serialization;

namespace TrackMate.API.Models.DTOs
{
    public class CustomerDto : BaseDto
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

        // Orders - circular references are handled by ReferenceHandler.Preserve
        public IEnumerable<OrderDto> Orders { get; set; } = new List<OrderDto>();

        // Invoices - circular references are handled by ReferenceHandler.Preserve
        public IEnumerable<InvoiceDto> Invoices { get; set; } = new List<InvoiceDto>();

        // Extra metrics for UI display
        public int OrderCount { get; set; }
        public int InvoiceCount { get; set; }
        public int EmailLogCount { get; set; }
        
        // Company - circular references are handled by ReferenceHandler.Preserve
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