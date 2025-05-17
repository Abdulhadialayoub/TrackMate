using System;
using System.ComponentModel.DataAnnotations;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.DTOs
{
    public class MessageLogDto : BaseDto
    {
        [Required]
        public new int CompanyId { get; set; }
        
        public int? CustomerId { get; set; }
        
        public string CustomerName { get; set; }

        [Required]
        [StringLength(100)]
        public string Recipient { get; set; }

        [Required]
        [StringLength(200)]
        public string Subject { get; set; }

        [Required]
        public string Content { get; set; }
        
        [Required]
        public MessageType MessageType { get; set; }

        [Required]
        public EmailStatus Status { get; set; }
        
        public string StatusDisplay { get; set; }

        public string ErrorMessage { get; set; }

        public DateTime? SentAt { get; set; }
        
        public DateTime? SentDate { get; set; }
        
        public int? RelatedEntityId { get; set; }
        
        public string RelatedEntityType { get; set; }
        
        public int? SentBy { get; set; }
        
        public string SentByName { get; set; }
    }

    public class CreateMessageLogDto
    {
        [Required]
        public int CompanyId { get; set; }
        
        public int? CustomerId { get; set; }

        [Required]
        [StringLength(100)]
        public string Recipient { get; set; }

        [Required]
        [StringLength(200)]
        public string Subject { get; set; }

        [Required]
        public string Content { get; set; }
        
        [Required]
        public MessageType MessageType { get; set; } = MessageType.Email;
        
        public EmailStatus Status { get; set; } = EmailStatus.Pending;
        
        public string ErrorMessage { get; set; }
        
        public DateTime? SentAt { get; set; }
        
        public DateTime? SentDate { get; set; } = DateTime.UtcNow;
        
        public int? RelatedEntityId { get; set; }
        
        public string RelatedEntityType { get; set; }
        
        public int? SentBy { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateMessageLogDto
    {
        [Required]
        public EmailStatus Status { get; set; }

        public string ErrorMessage { get; set; }

        public DateTime? SentAt { get; set; }
        
        public int? CustomerId { get; set; }
        
        public string UpdatedBy { get; set; } = string.Empty;
    }
    
    public class SendMessageDto
    {
        [Required]
        public string Recipient { get; set; }

        [Required]
        public string Subject { get; set; }

        [Required]
        public string Content { get; set; }
        
        [Required]
        public MessageType MessageType { get; set; } = MessageType.Email;
        
        [Required]
        public int CompanyId { get; set; }
        
        public int? CustomerId { get; set; }
        
        public int? RelatedEntityId { get; set; }
        
        public string RelatedEntityType { get; set; }
    }
} 