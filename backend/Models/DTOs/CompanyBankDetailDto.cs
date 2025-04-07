using System;

namespace TrackMate.API.Models.DTOs
{
    public class CompanyBankDetailDto : BaseDto
    {
        public new int Id { get; set; }
        public new int CompanyId { get; set; }
        public CompanyDto Company { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string IBAN { get; set; } = string.Empty;
        public string SWIFT { get; set; }
        public string Currency { get; set; }
        public new bool IsActive { get; set; }
        public int InvoiceCount { get; set; }
        public new DateTime CreatedAt { get; set; }
        public new string CreatedBy { get; set; } = string.Empty;
        public new DateTime? UpdatedAt { get; set; }
        public new string? UpdatedBy { get; set; }
    }

    public class CreateCompanyBankDetailDto
    {
        public int CompanyId { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string IBAN { get; set; } = string.Empty;
        public string SWIFT { get; set; }
        public string Currency { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateCompanyBankDetailDto
    {
        public string BankName { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string IBAN { get; set; } = string.Empty;
        public string SWIFT { get; set; }
        public string Currency { get; set; }
        public bool IsActive { get; set; }
        public string UpdatedBy { get; set; } = string.Empty;
    }
} 