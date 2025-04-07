﻿using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.Entities
{
    public class EmailLog : BaseEntity
    {
        public new int CompanyId { get; set; }
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

        [Required]
        public EmailStatus Status { get; set; }

        public string ErrorMessage { get; set; }

        public DateTime? SentAt { get; set; }
        public DateTime? SentDate { get; set; }
        public int? RelatedEntityId { get; set; }
        public string RelatedEntityType { get; set; }
        public int? SentBy { get; set; }

        [ForeignKey("CompanyId")]
        public new virtual Company Company { get; set; }

        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; }

        [ForeignKey("SentBy")]
        public virtual User SentByUser { get; set; }
    }
}
