namespace TrackMate.API.Models.DTOs
{
    public class EmailLogDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public int? CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string EmailContent { get; set; } = string.Empty;
        public string RecipientEmail { get; set; } = string.Empty;
        public string EmailType { get; set; } = string.Empty;
        public int? RelatedEntityId { get; set; }
        public string RelatedEntityType { get; set; } = string.Empty;
        public DateTime SentDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public int? SentBy { get; set; }
        public string SentByUserName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }

    public class CreateEmailLogDto
    {
        public int CompanyId { get; set; }
        public int? CustomerId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string EmailContent { get; set; } = string.Empty;
        public string RecipientEmail { get; set; } = string.Empty;
        public string EmailType { get; set; } = string.Empty;
        public int? RelatedEntityId { get; set; }
        public string RelatedEntityType { get; set; } = string.Empty;
        public int? SentBy { get; set; }
    }

    public class UpdateEmailLogDto
    {
        public string Status { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
    }
} 