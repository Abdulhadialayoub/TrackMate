using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TrackMate.API.Models.DTOs
{
    public abstract class BaseDto
    {
        public int Id { get; set; }
        
        [Required]
        public int CompanyId { get; set; }
        
        [Required]
        public bool IsActive { get; set; } = true;
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        [StringLength(50)]
        public string CreatedBy { get; set; } = string.Empty;
        
        public DateTime? UpdatedAt { get; set; }
        
        [StringLength(50)]
        public string UpdatedBy { get; set; } = string.Empty;
        
        public bool IsDeleted { get; set; } = false;
        
        // Virtual property for UI purposes
        public string DisplayName => $"ID: {Id}";
    }
} 