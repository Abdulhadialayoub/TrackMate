namespace TrackMate.API.Models.Entities
{
    public class EmailLog : BaseEntity
    {
        public int CompanyId { get; set; }
        public int? CustomerId { get; set; }
        public string Subject { get; set; }
        public string EmailContent { get; set; }
        public string RecipientEmail { get; set; }
        public string EmailType { get; set; }
        public int? RelatedEntityId { get; set; }
        public string RelatedEntityType { get; set; }
        public DateTime SentDate { get; set; }
        public string Status { get; set; }
        public string ErrorMessage { get; set; }
        public int? SentBy { get; set; }

        // Navigation Properties
        public virtual Company Company { get; set; }
        public virtual Customer Customer { get; set; }
        public virtual User SentByUser { get; set; }
    }
}
