using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.IO;
using System.Threading.Tasks;
using TrackMate.API.Data;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Tools
{
    public static class CreateDevUser
    {
        public static async Task CreateDevUserManuallyAsync()
        {
            Console.WriteLine("Starting manual Dev user creation process...");

            try
            {
                // Load configuration
                var configuration = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json")
                    .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}.json", optional: true)
                    .Build();

                // Create DB context options
                var optionsBuilder = new DbContextOptionsBuilder<TrackMateDbContext>();
                optionsBuilder.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));

                // Create context
                using var context = new TrackMateDbContext(optionsBuilder.Options);

                // Check if dev user already exists
                var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "dev@trackmate.com");
                if (existingUser != null)
                {
                    Console.WriteLine("Dev user already exists. No need to create.");
                    return;
                }

                Console.WriteLine("Dev user not found. Creating new dev user...");

                // Create company for the dev user
                var company = new Company
                {
                    Name = "Development Company",
                    Address = "123 Dev Street",
                    Phone = "555-DEV-COMP",
                    Email = "dev-company@trackmate.com",
                    CompanyId = 0, // This will be updated after save
                    CreatedBy = "system",
                    UpdatedBy = "system",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    TaxNumber = "123456789",
                    TaxOffice = "Dev Tax Office",
                    TaxId = "987654321",
                    Website = "https://dev.trackmate.com",
                    CreatedDate = DateTime.UtcNow
                };

                // Temporarily disable foreign key constraints
                await context.Database.ExecuteSqlRawAsync("ALTER TABLE Companies NOCHECK CONSTRAINT FK_Companies_Companies_CompanyId");
                
                // Add and save company to get its ID
                await context.Companies.AddAsync(company);
                await context.SaveChangesAsync();

                // Update CompanyId
                company.CompanyId = company.Id;
                await context.SaveChangesAsync();
                
                // Re-enable foreign key constraints
                await context.Database.ExecuteSqlRawAsync("ALTER TABLE Companies CHECK CONSTRAINT FK_Companies_Companies_CompanyId");

                Console.WriteLine($"Created development company with ID: {company.Id}");

                // Create dev user
                var user = new User
                {
                    FirstName = "Development",
                    LastName = "User",
                    Email = "dev@trackmate.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Dev123!"),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = "system",
                    UpdatedBy = "system",
                    Role = UserRole.Dev,
                    CompanyId = company.Id,
                    IsActive = true,
                    Username = "dev",
                    Phone = "555-DEV-USER",
                    RefreshToken = Guid.NewGuid().ToString(),
                    RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30)
                };

                // Add and save user
                await context.Users.AddAsync(user);
                await context.SaveChangesAsync();

                Console.WriteLine($"Successfully created Dev user with ID: {user.Id}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating Dev user: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                Console.WriteLine(ex.StackTrace);
                // Rethrow to ensure Program.cs knows about the failure
                throw;
            }
        }
    }
} 