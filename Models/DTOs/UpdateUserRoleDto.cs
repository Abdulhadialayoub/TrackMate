using System.ComponentModel.DataAnnotations;

namespace TrackMate.API.Models.DTOs
{
    public class UpdateUserRoleDto
    {
        [Required]
        [StringLength(20)]
        public string Role { get; set; }
    }
} 