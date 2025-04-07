using TrackMate.API.Models.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.DTOs
{
    public class OrderDto : BaseDto
    {
        [Required]
        public new int CompanyId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        [StringLength(50)]
        public string OrderNumber { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        public decimal SubTotal { get; set; }

        [Required]
        public decimal TaxAmount { get; set; }

        [Required]
        public decimal TotalAmount { get; set; }

        [Required]
        public OrderStatus Status { get; set; }

        public string Notes { get; set; }

        public IEnumerable<OrderItemDto> Items { get; set; }

        public CustomerDto Customer { get; set; }
    }

    public class CreateOrderDto
    {
        [Required]
        public int CompanyId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

        [Required]
        public DateTime DueDate { get; set; }

        public decimal TaxRate { get; set; } = 0;
        
        public decimal ShippingCost { get; set; } = 0;
        
        public string Currency { get; set; } = "USD";
        
        public string Status { get; set; } = "Draft";

        public string Notes { get; set; }
        
        public string CreatedBy { get; set; } = string.Empty;

        public IEnumerable<CreateOrderItemDto> Items { get; set; }
    }

    public class UpdateOrderDto
    {
        [Required]
        public DateTime OrderDate { get; set; }
        
        [Required]
        public DateTime DueDate { get; set; }
        
        public decimal TaxRate { get; set; }
        
        public decimal ShippingCost { get; set; }
        
        public string Currency { get; set; }
        
        public OrderStatus Status { get; set; }

        public string Notes { get; set; }
        
        public string UpdatedBy { get; set; } = string.Empty;

        public IEnumerable<UpdateOrderItemDto> Items { get; set; }
    }
    
    public class UpdateOrderStatusDto
    {
        [Required]
        public OrderStatus Status { get; set; }
    }
} 