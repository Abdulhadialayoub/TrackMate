using AutoMapper;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;
using System;
using System.Linq;
using System.Collections.Generic;

namespace TrackMate.API.Models.Mappings
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            // User mappings
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));
            
            // Add missing mapping from CreateUserDto to User
            CreateMap<CreateUserDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore()); // Password is hashed in the service
            
            // Add mapping from UpdateUserDto to User
            CreateMap<UpdateUserDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());
            
            // Company mappings
            CreateMap<Company, CompanyDto>();
            CreateMap<CreateCompanyDto, Company>();
            CreateMap<UpdateCompanyDto, Company>();

            // Customer mappings
            CreateMap<Customer, CustomerDto>()
                .ForMember(dest => dest.OrderCount, opt => opt.MapFrom(src => src.Orders != null ? src.Orders.Count : 0))
                .ForMember(dest => dest.InvoiceCount, opt => opt.MapFrom(src => src.Invoices != null ? src.Invoices.Count : 0))
                .ForMember(dest => dest.EmailLogCount, opt => opt.MapFrom(src => src.EmailLogs != null ? src.EmailLogs.Count : 0));
            
            CreateMap<CreateCustomerDto, Customer>()
                .ForMember(dest => dest.Orders, opt => opt.Ignore())
                .ForMember(dest => dest.Invoices, opt => opt.Ignore())
                .ForMember(dest => dest.EmailLogs, opt => opt.Ignore());
            
            CreateMap<UpdateCustomerDto, Customer>()
                .ForMember(dest => dest.Orders, opt => opt.Ignore())
                .ForMember(dest => dest.Invoices, opt => opt.Ignore())
                .ForMember(dest => dest.EmailLogs, opt => opt.Ignore());

            // Product mappings
            CreateMap<CreateProductDto, Product>()
                .ForMember(dest => dest.CategoryId, opt => opt.MapFrom(src => int.Parse(src.Category)))
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.CreatedBy)); // Explicitly map UpdatedBy from CreatedBy
            CreateMap<UpdateProductDto, Product>()
                .ForMember(dest => dest.CategoryId, opt => opt.MapFrom(src => int.Parse(src.Category)))
                .ForMember(dest => dest.Category, opt => opt.Ignore());
            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name));

            // Order mappings
            CreateMap<Order, OrderDto>()
                .ForMember(dest => dest.TotalAmount, opt => opt.MapFrom(src => src.Total))
                .ForMember(dest => dest.ShippingCost, opt => opt.MapFrom(src => 
                    src.ShippingCost >= 0 ? src.ShippingCost : 0))
                .ForMember(dest => dest.TaxRate, opt => opt.MapFrom(src => 
                    src.TaxRate >= 0 ? src.TaxRate : 0))
                .ForMember(dest => dest.Currency, opt => opt.MapFrom(src => 
                    !string.IsNullOrEmpty(src.Currency) ? src.Currency : "USD"))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => 
                    SafeParseEnum<OrderStatus>(!string.IsNullOrEmpty(src.Status) ? src.Status : "Draft")))
                .ForMember(dest => dest.Customer, opt => opt.MapFrom(src => 
                    src.Customer != null ? src.Customer : null))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.OrderItems))
                .AfterMap((src, dest) => {
                    // If there's no customer, try to resolve it by customerId
                    if (dest.Customer == null) {
                        // Instead of immediately creating a fallback CustomerDto,
                        // we'll preserve the original CustomerId to help identify the proper customer
                        dest.Customer = new CustomerDto { 
                            Id = src.CustomerId, 
                            Name = "Unknown Customer",
                            CompanyId = src.CompanyId
                        };
                    }
                    
                    // Ensure OrderDate and DueDate are valid
                    if (dest.OrderDate == default) {
                        dest.OrderDate = DateTime.UtcNow;
                    }
                    
                    if (dest.DueDate == default) {
                        dest.DueDate = DateTime.UtcNow.AddDays(30);
                    }
                    
                    // Ensure Items collection is initialized
                    if (dest.Items == null) {
                        dest.Items = new List<OrderItemDto>();
                    }
                });
            CreateMap<CreateOrderDto, Order>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => 
                    SafeParseEnum<OrderStatus>(src.Status)));
            CreateMap<UpdateOrderDto, Order>()
                .ForMember(dest => dest.Total, opt => opt.Ignore()) // Total will be calculated in service
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
            
            // OrderItem mappings
            CreateMap<OrderItem, OrderItemDto>()
                .ForMember(dest => dest.TotalAmount, opt => opt.MapFrom(src => src.Total))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => 
                    src.Product != null ? src.Product.Name : "Unknown Product"))
                .ForMember(dest => dest.TaxRate, opt => opt.MapFrom(src => 0M))
                .ForMember(dest => dest.TaxAmount, opt => opt.MapFrom(src => 0M));
            CreateMap<CreateOrderItemDto, OrderItem>();
            
            // Invoice mappings
            CreateMap<Invoice, InvoiceDto>()
                .ForMember(dest => dest.Subtotal, opt => opt.MapFrom(src => src.Subtotal))
                .ForMember(dest => dest.TaxAmount, opt => opt.MapFrom(src => src.TaxAmount))
                .ForMember(dest => dest.ShippingCost, opt => opt.MapFrom(src => src.ShippingCost))
                .ForMember(dest => dest.Total, opt => opt.MapFrom(src => src.Total));
            CreateMap<CreateInvoiceDto, Invoice>();
            CreateMap<UpdateInvoiceDto, Invoice>();
            
            // InvoiceItem mappings
            CreateMap<InvoiceItem, InvoiceItemDto>();
            CreateMap<CreateInvoiceItemDto, InvoiceItem>()
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => 
                    string.IsNullOrEmpty(src.UpdatedBy) ? src.CreatedBy : src.UpdatedBy))
                .ForMember(dest => dest.CompanyId, opt => opt.MapFrom(src => src.CompanyId));
            
            // Category mappings
            CreateMap<Category, CategoryDto>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                .ForMember(dest => dest.ProductCount, opt => opt.Ignore()); // Ignore ProductCount for now
            CreateMap<CreateCategoryDto, Category>();
            CreateMap<UpdateCategoryDto, Category>();

            

            // SystemConfiguration mappings
            CreateMap<SystemConfiguration, SystemConfigurationDto>();
            CreateMap<SystemConfigurationDto, SystemConfiguration>();

            // EmailLog mappings
            CreateMap<EmailLog, EmailLogDto>();
            CreateMap<CreateEmailLogDto, EmailLog>();
            CreateMap<UpdateEmailLogDto, EmailLog>();

            // MessageLog mappings
            CreateMap<MessageLog, MessageLogDto>()
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => 
                    src.Customer != null ? src.Customer.Name : "Unknown Customer"))
                .ForMember(dest => dest.SentByName, opt => opt.MapFrom(src => 
                    src.SentByUser != null ? src.SentByUser.Username : "System"))
                .ForMember(dest => dest.StatusDisplay, opt => opt.MapFrom(src => 
                    src.Status.ToString()));
            CreateMap<CreateMessageLogDto, MessageLog>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Content));
            CreateMap<UpdateMessageLogDto, MessageLog>();

            // Other entity mappings can be added here as needed
        }

        // Helper method to safely parse enum values without 'out' parameters
        private static TEnum SafeParseEnum<TEnum>(string value) where TEnum : struct
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return default;
            }
            
            if (Enum.TryParse<TEnum>(value, true, out var result))
            {
                return result;
            }
            
            return default;
        }
    }
}



