using System;
using System.ComponentModel.DataAnnotations;

namespace TrackMate.API.Models.DTOs
{
    public abstract class BaseDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string UpdatedBy { get; set; }
        public bool IsDeleted { get; set; }
    }
} 