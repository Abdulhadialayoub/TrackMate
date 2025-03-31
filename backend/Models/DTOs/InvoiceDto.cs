namespace TrackMate.API.Models.DTOs
{
    public class InvoiceDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public List<InvoiceItemDto> InvoiceItems { get; set; } = new();
    }

    public class InvoiceItemDto
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class CreateInvoiceDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int CompanyId { get; set; }
        public DateTime DueDate { get; set; }
        public List<CreateInvoiceItemDto> InvoiceItems { get; set; } = new();
    }

    public class CreateInvoiceItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class UpdateInvoiceDto
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int CompanyId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public List<UpdateInvoiceItemDto> InvoiceItems { get; set; } = new();
    }

    public class UpdateInvoiceItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
} 