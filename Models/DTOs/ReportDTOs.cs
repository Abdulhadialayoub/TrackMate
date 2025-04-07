using System;
using System.Collections.Generic;

namespace TrackMate.API.Models.DTOs
{
    public class SalesReportDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; }
        public decimal TotalSales { get; set; }
        public int OrderCount { get; set; }
        public int ItemCount { get; set; }
    }

    public class ProductPerformanceDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int TotalQuantity { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class CustomerPerformanceDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public int OrderCount { get; set; }
        public decimal TotalSpent { get; set; }
        public DateTime LastOrderDate { get; set; }
    }

    public class SystemStatusDto
    {
        public int UserCount { get; set; }
        public int CompanyCount { get; set; }
        public int ProductCount { get; set; }
        public int OrderCount { get; set; }
        public int CustomerCount { get; set; }
        public DateTime LatestOrderDate { get; set; }
        public DateTime LatestUserRegistration { get; set; }
        public string SystemVersion { get; set; }
        public string StartupTime { get; set; }
        public DateTime ServerTime { get; set; }
    }
} 