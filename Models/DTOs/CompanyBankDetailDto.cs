namespace TrackMate.API.Models.DTOs
{
    public class CompanyBankDetailDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string IBAN { get; set; } = string.Empty;
        public string SWIFT { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }

    public class CreateCompanyBankDetailDto
    {
        public int CompanyId { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string IBAN { get; set; } = string.Empty;
        public string SWIFT { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
    }

    public class UpdateCompanyBankDetailDto
    {
        public string BankName { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
        public string IBAN { get; set; } = string.Empty;
        public string SWIFT { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
    }
} 