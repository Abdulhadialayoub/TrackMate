using Microsoft.EntityFrameworkCore;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Data
{
    public class TrackMateDbContext : DbContext
    {
        public TrackMateDbContext(DbContextOptions<TrackMateDbContext> options) : base(options)
        {
        }

        public DbSet<Company> Companies { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<CompanyBankDetail> CompanyBankDetails { get; set; }
        public DbSet<EmailLog> EmailLogs { get; set; }
        public DbSet<SystemConfiguration> SystemConfigurations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure decimal properties
            ConfigureDecimalPrecision(modelBuilder);
            
            // Configure Company self-reference to avoid cascading delete issues
            modelBuilder.Entity<Company>()
                .HasOne(c => c.Company)
                .WithMany()
                .HasForeignKey(c => c.CompanyId)
                .OnDelete(DeleteBehavior.NoAction);  // Use NoAction instead of Cascade
            
            // Company İlişkileri
            modelBuilder.Entity<Company>()
                .HasMany(c => c.Users)
                .WithOne(u => u.Company)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Company>()
                .HasMany(c => c.Customers)
                .WithOne(c => c.Company)
                .HasForeignKey(c => c.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Company>()
                .HasMany(c => c.Orders)
                .WithOne(o => o.Company)
                .HasForeignKey(o => o.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Company>()
                .HasMany(c => c.Products)
                .WithOne(p => p.Company)
                .HasForeignKey(p => p.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Company>()
                .HasMany(c => c.BankDetails)
                .WithOne(b => b.Company)
                .HasForeignKey(b => b.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Company>()
                .HasMany(c => c.EmailLogs)
                .WithOne(e => e.Company)
                .HasForeignKey(e => e.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Customer İlişkileri
            modelBuilder.Entity<Customer>()
                .HasMany(c => c.Orders)
                .WithOne(o => o.Customer)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Customer>()
                .HasMany(c => c.Invoices)
                .WithOne(i => i.Customer)
                .HasForeignKey(i => i.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Customer>()
                .HasMany(c => c.EmailLogs)
                .WithOne(e => e.Customer)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order İlişkileri
            modelBuilder.Entity<Order>()
                .HasMany(o => o.OrderItems)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.CreatedByUser)
                .WithMany()
                .HasForeignKey(o => o.CreatedBy)
                .HasPrincipalKey(u => u.Username)
                .OnDelete(DeleteBehavior.Restrict);

            // Invoice İlişkileri
            modelBuilder.Entity<Invoice>()
                .HasMany(i => i.InvoiceItems)
                .WithOne(ii => ii.Invoice)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Bank)
                .WithMany(b => b.Invoices)
                .HasForeignKey(i => i.BankDetailsId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.CreatedByUser)
                .WithMany()
                .HasForeignKey(i => i.CreatedBy)
                .HasPrincipalKey(u => u.Username)
                .OnDelete(DeleteBehavior.Restrict);

            // Product İlişkileri
            modelBuilder.Entity<Product>()
                .HasMany(p => p.OrderItems)
                .WithOne(oi => oi.Product)
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasMany(p => p.InvoiceItems)
                .WithOne(ii => ii.Product)
                .HasForeignKey(ii => ii.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // EmailLog İlişkileri
            modelBuilder.Entity<EmailLog>()
                .HasOne(e => e.SentByUser)
                .WithMany()
                .HasForeignKey(e => e.SentBy)
                .OnDelete(DeleteBehavior.Restrict);

            // Check and modify any potential cascade delete relationships
            // Modify Company relationships to use NoAction
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                // Get all relationships
                foreach (var relationship in entityType.GetForeignKeys())
                {
                    // If the delete behavior is Cascade and it's not a self-relationship within the same entity
                    if (relationship.DeleteBehavior == DeleteBehavior.Cascade)
                    {
                        // Change to NoAction
                        relationship.DeleteBehavior = DeleteBehavior.ClientSetNull;
                    }
                }
            }
        }

        private void ConfigureDecimalPrecision(ModelBuilder modelBuilder)
        {
            // Invoice decimal properties
            modelBuilder.Entity<Invoice>()
                .Property(i => i.Subtotal).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Invoice>()
                .Property(i => i.TaxRate).HasColumnType("decimal(10,2)");
            modelBuilder.Entity<Invoice>()
                .Property(i => i.TaxAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Invoice>()
                .Property(i => i.ShippingCost).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Invoice>()
                .Property(i => i.Total).HasColumnType("decimal(18,2)");
            
            // InvoiceItem decimal properties
            modelBuilder.Entity<InvoiceItem>()
                .Property(ii => ii.UnitPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<InvoiceItem>()
                .Property(ii => ii.Quantity).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<InvoiceItem>()
                .Property(ii => ii.TaxRate).HasColumnType("decimal(10,2)");
            modelBuilder.Entity<InvoiceItem>()
                .Property(ii => ii.TaxAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<InvoiceItem>()
                .Property(ii => ii.Subtotal).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<InvoiceItem>()
                .Property(ii => ii.Total).HasColumnType("decimal(18,2)");
            
            // Order decimal properties
            modelBuilder.Entity<Order>()
                .Property(o => o.SubTotal).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>()
                .Property(o => o.TaxRate).HasColumnType("decimal(10,2)");
            modelBuilder.Entity<Order>()
                .Property(o => o.TaxAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>()
                .Property(o => o.ShippingCost).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Order>()
                .Property(o => o.Total).HasColumnType("decimal(18,2)");
            
            // OrderItem decimal properties
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.Total).HasColumnType("decimal(18,2)");
            
            // Product decimal properties
            modelBuilder.Entity<Product>()
                .Property(p => p.UnitPrice).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Product>()
                .Property(p => p.Weight).HasColumnType("decimal(10,2)");
        }
    }
}