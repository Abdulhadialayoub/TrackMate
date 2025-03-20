namespace TrackMate.API.Models.Entities
{
    public class CompanyBankDetail : BaseEntity
    {
        public int CompanyId { get; set; }
        public string BankName { get; set; }
        public string AccountName { get; set; }
        public string IBAN { get; set; }
        public string SWIFT { get; set; }
        public string Currency { get; set; }

        // Navigation Property
        public virtual Company Company { get; set; }
        public virtual ICollection<Invoice> Invoices { get; set; }
    }
}
