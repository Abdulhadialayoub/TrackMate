using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading.Tasks;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Data
{
    public static class DevUserSeed
    {
        public static async Task SeedDevUserAsync(IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<TrackMateDbContext>();

                // Check if a Dev user already exists
                var devUserExists = await dbContext.Users.AnyAsync(u => u.Role == UserRole.Dev);
                if (devUserExists)
                {
                    // Dev user already exists, no need to create
                    return;
                }

                try
                {
                    // Create a company for the Dev user
                    var company = new Company
                    {
                        Name = "TrackMate Development",
                        TaxId = "12345678901",
                        Address = "Development Street 123, Tech City",
                        Phone = "+1234567890",
                        Email = "dev@trackmate.com",
                        Website = "https://trackmate.com",
                        CreatedDate = DateTime.UtcNow,
                        TaxNumber = "12345678901",
                        TaxOffice = "Tech Office",
                        CompanyId = 0 // Main company has no parent, use 0 instead of null for int
                    };

                    // Add the company to the context
                    dbContext.Companies.Add(company);

                    // Save to get the company ID
                    await dbContext.SaveChangesAsync();

                    // Create the Dev user
                    var devUser = new User
                    {
                        Username = "dev",
                        Email = "dev@trackmate.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Dev123!"), // Hashed password
                        FirstName = "TrackMate",
                        LastName = "Developer",
                        Phone = "+1234567890",
                        Role = UserRole.Dev,
                        IsActive = true,
                        CompanyId = company.Id,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "system"
                    };

                    // Add the user to the context
                    dbContext.Users.Add(devUser);

                    // Save changes
                    await dbContext.SaveChangesAsync();

                    Console.WriteLine("Dev user created successfully!");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error seeding Dev user: {ex.Message}");
                }
            }
        }
    }
} 