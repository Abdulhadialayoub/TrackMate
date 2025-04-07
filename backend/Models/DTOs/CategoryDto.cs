using System;
using System.ComponentModel.DataAnnotations;

namespace TrackMate.API.Models.DTOs
{
    public class CategoryDto : BaseDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }
        
        public int ProductCount { get; set; }
    }

    public class CreateCategoryDto
    {
        [Required]
        public int CompanyId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateCategoryDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }
        
        public string UpdatedBy { get; set; } = string.Empty;
    }
} 