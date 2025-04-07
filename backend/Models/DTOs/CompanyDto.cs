using System;
using System.ComponentModel.DataAnnotations;

namespace TrackMate.API.Models.DTOs
{
    public class CompanyDto : BaseDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        public string TaxNumber { get; set; }

        [Required]
        [StringLength(200)]
        public string Address { get; set; }

        [Required]
        [StringLength(20)]
        public string Phone { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [StringLength(100)]
        public string Website { get; set; }

        public IEnumerable<CompanyBankDetailDto> BankDetails { get; set; }
    }

    public class CreateCompanyDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        public string TaxNumber { get; set; }

        [Required]
        [StringLength(200)]
        public string Address { get; set; }

        [Required]
        [StringLength(20)]
        public string Phone { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [StringLength(100)]
        public string Website { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateCompanyDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(20)]
        public string TaxNumber { get; set; }

        [Required]
        [StringLength(200)]
        public string Address { get; set; }

        [Required]
        [StringLength(20)]
        public string Phone { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [StringLength(100)]
        public string Website { get; set; }
        
        public string UpdatedBy { get; set; } = string.Empty;
    }

    public class UpdateCompanyStatusDto
    {
        [Required]
        public bool IsActive { get; set; }
        
        public string Status { get; set; }
    }
} 