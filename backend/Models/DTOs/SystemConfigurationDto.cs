using System;
using System.ComponentModel.DataAnnotations;

namespace TrackMate.API.Models.DTOs
{
    public class SystemConfigurationDto
    {
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
        
        public string Version { get; set; }
        
        public DateTime LastUpdated { get; set; }
        
        public string UpdatedBy { get; set; }
    }
    
    public class DatabaseStatusDto
    {
        public string DatabaseName { get; set; }
        
        public string Status { get; set; }
        
        public long SizeInMB { get; set; }
        
        public int TotalTables { get; set; }
        
        public int TotalUsers { get; set; }
        
        public int TotalCompanies { get; set; }
        
        public int TotalProducts { get; set; }
        
        public int TotalOrders { get; set; }
        
        public DateTime LastBackupDate { get; set; }
        
        public string BackupPath { get; set; }
        
        public string ServerVersion { get; set; }
    }
} 