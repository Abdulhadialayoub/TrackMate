using System;
using System.ComponentModel.DataAnnotations;

namespace TrackMate.API.Models.Entities
{
    public class SystemConfiguration
    {
        [Key]
        public int Id { get; set; }
        
        public bool MaintenanceMode { get; set; }
        
        public bool UserRegistration { get; set; }
        
        public bool DebugMode { get; set; }
        
        [Required]
        [StringLength(20)]
        public string DefaultUserRole { get; set; }
        
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string SystemEmail { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Version { get; set; }
        
        public DateTime LastUpdated { get; set; }
        
        [StringLength(100)]
        public string UpdatedBy { get; set; }
    }
} 