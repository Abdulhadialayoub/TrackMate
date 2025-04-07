using System;
using System.ComponentModel.DataAnnotations;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public int CompanyId { get; set; }
        public CompanyDto Company { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public int Quantity { get; set; }
        public int StockQuantity { get; set; }
        public int? CategoryId { get; set; }
        public CategoryDto Category { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD";
        public ProductStatus Status { get; set; } = ProductStatus.Active;
        public string SKU { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int OrderItemCount { get; set; }
        public int InvoiceItemCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public string UpdatedBy { get; set; }
    }

    public class CreateProductDto
    {
        public int CompanyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public int Quantity { get; set; }
        public int StockQuantity { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD";
        public ProductStatus Status { get; set; } = ProductStatus.Active;
        public string SKU { get; set; } = string.Empty;
        public string CreatedBy { get; set; } = string.Empty;
    }

    public class UpdateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public int Quantity { get; set; }
        public int StockQuantity { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD";
        public ProductStatus Status { get; set; } = ProductStatus.Active;
        public string SKU { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string UpdatedBy { get; set; } = string.Empty;
    }

    public class UpdateProductStatusDto
    {
        [Required]
        public ProductStatus Status { get; set; }
    }

    public class UpdateProductStockDto
    {
        [Required]
        public int Quantity { get; set; }
    }
} 