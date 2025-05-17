using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TrackMate.API.Models.Enums;
using System.Text.Json.Serialization;

namespace TrackMate.API.Models.DTOs
{
    public class InvoiceDto : BaseDto
    {
        [Required]
        public new int CompanyId { get; set; }
        public int CustomerId { get; set; }
        public int OrderId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal Total { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        
        // Shipping Information
        public string ShippingAddress { get; set; } = string.Empty;
        public string ShippingMethod { get; set; } = string.Empty;
        public string TrackingNumber { get; set; } = string.Empty;
        
        public new bool IsActive { get; set; }
        
        // Customer - circular references are handled by ReferenceHandler.IgnoreCycles
        public CustomerDto Customer { get; set; }
        
        // Extra property for convenience
        public string CustomerName => Customer?.Name;
        
        // Company - circular references are handled by ReferenceHandler.IgnoreCycles
        public CompanyDto Company { get; set; }
        
        // Extra property for convenience
        public string CompanyName => Company?.Name;
        
        // Order - circular references are handled by ReferenceHandler.IgnoreCycles
        public OrderDto Order { get; set; }
        
        // Extra property for convenience
        public string OrderNumber => Order?.OrderNumber;
        
        public List<InvoiceItemDto> InvoiceItems { get; set; } = new();
    }

    public class CreateInvoiceDto
    {
        public int CompanyId { get; set; }
        public int CustomerId { get; set; }
        public int? OrderId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal TaxRate { get; set; }
        public decimal ShippingCost { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        
        // Shipping Information
        public string ShippingAddress { get; set; }
        public string ShippingMethod { get; set; }
        public string TrackingNumber { get; set; }
        
        public string CreatedBy { get; set; }
        public string UpdatedBy { get; set; }
        public List<CreateInvoiceItemDto> InvoiceItems { get; set; } = new List<CreateInvoiceItemDto>();
    }

    public class UpdateInvoiceDto
    {
        public int CustomerId { get; set; }
        public int? OrderId { get; set; }
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal TaxRate { get; set; }
        public decimal ShippingCost { get; set; }
        public string Currency { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        
        // Shipping Information
        public string ShippingAddress { get; set; }
        public string ShippingMethod { get; set; }
        public string TrackingNumber { get; set; }
        
        public string UpdatedBy { get; set; }
        public List<CreateInvoiceItemDto> InvoiceItems { get; set; }
    }
    
    public class UpdateInvoiceStatusDto
    {
        [Required]
        public InvoiceStatus Status { get; set; }
    }

    public class InvoiceItemDto
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal TaxRate { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Total { get; set; }
        public ProductDto Product { get; set; }
    }

    public class CreateInvoiceItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string Description { get; set; }
        public decimal TaxRate { get; set; }
        public int CompanyId { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
} 