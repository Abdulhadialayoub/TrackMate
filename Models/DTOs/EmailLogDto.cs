using System;
using System.ComponentModel.DataAnnotations;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.DTOs
{
    public class EmailLogDto : BaseDto
    {
        [Required]
        public new int CompanyId { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string To { get; set; }

        [Required]
        [StringLength(200)]
        public string Subject { get; set; }

        [Required]
        public string Body { get; set; }

        [Required]
        public EmailStatus Status { get; set; }

        public string ErrorMessage { get; set; }

        public DateTime? SentAt { get; set; }
    }

    public class CreateEmailLogDto
    {
        [Required]
        public int CompanyId { get; set; }
        
        public int? CustomerId { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string To { get; set; }

        [Required]
        [StringLength(200)]
        public string Subject { get; set; }

        [Required]
        public string Body { get; set; }
        
        public EmailStatus Status { get; set; } = EmailStatus.Pending;
        
        public string ErrorMessage { get; set; }
        
        public DateTime? SentAt { get; set; }
        
        public DateTime? SentDate { get; set; }
        
        public int? RelatedEntityId { get; set; }
        
        public string RelatedEntityType { get; set; }
        
        public int? SentBy { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateEmailLogDto
    {
        [Required]
        public EmailStatus Status { get; set; }

        public string ErrorMessage { get; set; }

        public DateTime? SentAt { get; set; }
        
        public int? CustomerId { get; set; }
        
        public string UpdatedBy { get; set; } = string.Empty;
    }
} 