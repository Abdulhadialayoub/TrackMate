using System;
using System.Collections.Generic;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.Entities
{
    public class Product : BaseEntity
    {
        public new int CompanyId { get; set; }
        public new virtual Company Company { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public int Quantity { get; set; }
        public int StockQuantity { get; set; }
        public int? CategoryId { get; set; }
        public virtual Category Category { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD";
        public ProductStatus Status { get; set; } = ProductStatus.Active;
        public string SKU { get; set; } = string.Empty;
        public new bool IsActive { get; set; } = true;
        public DateTime AddDate { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
    }
}
