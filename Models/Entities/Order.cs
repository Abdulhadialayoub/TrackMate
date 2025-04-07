using System;
using System.Collections.Generic;

namespace TrackMate.API.Models.Entities
{
    public class Order : BaseEntity
    {
        public new int CompanyId { get; set; }
        public new virtual Company Company { get; set; }
        public int CustomerId { get; set; }
        public virtual Customer Customer { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal Total { get; set; }
        public string Currency { get; set; } = "USD";
        public string Status { get; set; } = "Draft";
        public string Notes { get; set; } = string.Empty;
        public new string CreatedBy { get; set; }
        public virtual User CreatedByUser { get; set; }
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
