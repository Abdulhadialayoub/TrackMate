using System.ComponentModel.DataAnnotations;

namespace TrackMate.API.Models.DTOs
{
    public class OrderItemDto : BaseDto
    {
        [Required]
        public int OrderId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(200)]
        public string Description { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [Required]
        public decimal TaxRate { get; set; }

        [Required]
        public decimal TaxAmount { get; set; }

        [Required]
        public decimal TotalAmount { get; set; }

        public ProductDto Product { get; set; }
    }

    public class CreateOrderItemDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        [StringLength(200)]
        public string Description { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [Required]
        public decimal TaxRate { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateOrderItemDto
    {
        [Required]
        [StringLength(200)]
        public string Description { get; set; }

        [Required]
        public decimal Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }

        [Required]
        public decimal TaxRate { get; set; }
        
        public string UpdatedBy { get; set; } = string.Empty;
    }
} 