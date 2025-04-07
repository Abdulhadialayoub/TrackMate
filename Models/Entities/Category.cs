using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrackMate.API.Models.Entities
{
    public class Category : BaseEntity
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        public new int CompanyId { get; set; }

        [ForeignKey("CompanyId")]
        public new virtual Company Company { get; set; }

        public virtual ICollection<Product> Products { get; set; } = new HashSet<Product>();
    }
} 