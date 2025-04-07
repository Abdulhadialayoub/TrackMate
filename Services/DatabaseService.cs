using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TrackMate.API.Data;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Services
{
    public class DatabaseService : IDatabaseService
    {
        private readonly TrackMateDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DatabaseService> _logger;

        public DatabaseService(
            TrackMateDbContext context,
            IConfiguration configuration,
            ILogger<DatabaseService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> BackupDatabaseAsync()
        {
            try
            {
                _logger.LogInformation("Starting database backup");

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                var databaseName = connectionString.Split(';')
                    .FirstOrDefault(s => s.TrimStart().StartsWith("Initial Catalog", StringComparison.OrdinalIgnoreCase) || 
                                        s.TrimStart().StartsWith("Database", StringComparison.OrdinalIgnoreCase))
                    ?.Split('=')[1].Trim() ?? "TrackMate";

                var backupDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Backups");
                Directory.CreateDirectory(backupDirectory);

                var backupFileName = $"{databaseName}_backup_{DateTime.Now:yyyyMMdd_HHmmss}.bak";
                var backupPath = Path.Combine(backupDirectory, backupFileName);

                // SQL Server için örnek yedekleme komutu
                var backupCommand = $"BACKUP DATABASE [{databaseName}] TO DISK = '{backupPath}' WITH FORMAT, MEDIANAME = 'TrackMateBackup', NAME = 'TrackMate Backup';";
                
                await _context.Database.ExecuteSqlRawAsync(backupCommand);
                
                _logger.LogInformation("Database backup completed successfully. Path: {BackupPath}", backupPath);
                
                return backupPath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error backing up database");
                throw;
            }
        }

        public async Task RestoreDatabaseAsync(string backupFilePath)
        {
            try
            {
                _logger.LogInformation("Starting database restore from {BackupFilePath}", backupFilePath);

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                var databaseName = connectionString.Split(';')
                    .FirstOrDefault(s => s.TrimStart().StartsWith("Initial Catalog", StringComparison.OrdinalIgnoreCase) || 
                                        s.TrimStart().StartsWith("Database", StringComparison.OrdinalIgnoreCase))
                    ?.Split('=')[1].Trim() ?? "TrackMate";

                // Veritabanı bağlantılarını kapat
                var closeConnectionsCommand = $"ALTER DATABASE [{databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;";
                await _context.Database.ExecuteSqlRawAsync(closeConnectionsCommand);

                // Veritabanını geri yükle
                var restoreCommand = $"RESTORE DATABASE [{databaseName}] FROM DISK = '{backupFilePath}' WITH REPLACE;";
                await _context.Database.ExecuteSqlRawAsync(restoreCommand);

                // Veritabanını tekrar multi-user moda geçir
                var openConnectionsCommand = $"ALTER DATABASE [{databaseName}] SET MULTI_USER;";
                await _context.Database.ExecuteSqlRawAsync(openConnectionsCommand);

                _logger.LogInformation("Database restore completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring database");
                throw;
            }
        }

        public async Task ResetDatabaseAsync()
        {
            try
            {
                _logger.LogInformation("Starting database reset");

                // Disable foreign key constraints temporarily
                await _context.Database.ExecuteSqlRawAsync("EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'");

                // Delete data with proper error handling
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.InvoiceItems', 'U') IS NOT NULL DELETE FROM InvoiceItems"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing InvoiceItems table"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.Invoices', 'U') IS NOT NULL DELETE FROM Invoices"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing Invoices table"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DELETE FROM OrderItems"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing OrderItems table"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DELETE FROM Orders"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing Orders table"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DELETE FROM Products"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing Products table"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.Customers', 'U') IS NOT NULL DELETE FROM Customers"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing Customers table"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.CompanyBankDetails', 'U') IS NOT NULL DELETE FROM CompanyBankDetails"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing CompanyBankDetails table"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.EmailLogs', 'U') IS NOT NULL DELETE FROM EmailLogs"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing EmailLogs table"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.SystemConfigurations', 'U') IS NOT NULL DELETE FROM SystemConfigurations"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing SystemConfigurations table"); }

                // Keep Dev users and primary company, delete all others
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DELETE FROM Users WHERE Role != 'Dev'"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing non-Dev Users"); }
                
                try { await _context.Database.ExecuteSqlRawAsync("IF OBJECT_ID('dbo.Companies', 'U') IS NOT NULL DELETE FROM Companies WHERE Id != 1"); } 
                catch (Exception ex) { _logger.LogWarning(ex, "Error clearing Companies"); }

                // Re-enable foreign key constraints
                await _context.Database.ExecuteSqlRawAsync("EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT ALL'");
                
                // Seed sample data
                await SeedSampleDataAsync();

                _logger.LogInformation("Database reset completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting database");
                throw;
            }
        }

        private async Task SeedSampleDataAsync()
        {
            try
            {
                _logger.LogInformation("Seeding sample data");

                // Create default company if it doesn't exist
                try
                {
                    await _context.Database.ExecuteSqlRawAsync(@"
                        IF NOT EXISTS (SELECT * FROM Companies WHERE Name = 'Demo Company')
                        BEGIN
                            INSERT INTO Companies (Name, Email, Phone, Address, TaxNumber, TaxOffice, Website, IsActive, CreatedAt, CreatedBy)
                            VALUES ('Demo Company', 'demo@example.com', '123-456-7890', '123 Main St', '12345', 'Tax Office', 'demo.example.com', 1, GETUTCDATE(), 'System')
                        END
                    ");
                    _logger.LogInformation("Default company created or already exists");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error creating default company");
                }

                // Create default admin user if it doesn't exist
                try
                {
                    await _context.Database.ExecuteSqlRawAsync(@"
                        IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@example.com')
                        BEGIN
                            INSERT INTO Users (CompanyId, Username, Email, PasswordHash, FirstName, LastName, Phone, Role, IsActive, CreatedAt, CreatedBy)
                            VALUES ((SELECT TOP 1 Id FROM Companies), 'admin', 'admin@example.com', '$2a$11$JiF9eiUQSz4e1QQOc0VueeZcqEEJCJyQsN2U6yOsrp.mOHBN/U.1a', 'Admin', 'User', '123-456-7890', 'Admin', 1, GETUTCDATE(), 'System')
                        END
                    ");
                    _logger.LogInformation("Default admin user created or already exists");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error creating default admin user");
                }

                // Create sample configuration
                try
                {
                    await _context.Database.ExecuteSqlRawAsync(@"
                        IF NOT EXISTS (SELECT * FROM SystemConfigurations)
                        BEGIN
                            INSERT INTO SystemConfigurations (MaintenanceMode, UserRegistration, DebugMode, DefaultUserRole, SystemEmail, Version, LastUpdated, UpdatedBy)
                            VALUES (0, 1, 0, 'User', 'system@trackmate.com', '1.0.0', GETUTCDATE(), 'System')
                        END
                    ");
                    _logger.LogInformation("Default system configuration created or already exists");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error creating default system configuration");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SeedSampleDataAsync");
                // We don't want to throw here as it would stop the whole reset process
            }
        }

        public async Task<DatabaseStatusDto> GetDatabaseStatusAsync()
        {
            try
            {
                _logger.LogInformation("Getting database status");

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                var databaseName = connectionString.Split(';')
                    .FirstOrDefault(s => s.TrimStart().StartsWith("Initial Catalog", StringComparison.OrdinalIgnoreCase) || 
                                        s.TrimStart().StartsWith("Database", StringComparison.OrdinalIgnoreCase))
                    ?.Split('=')[1].Trim() ?? "TrackMate";

                // Veritabanı boyutu sorgusu
                var sizeQuery = @"
                    SELECT 
                        SUM(size * 8 / 1024) AS SizeMB
                    FROM sys.database_files
                    WHERE type_desc = 'ROWS'";
                
                var size = await _context.Database.SqlQueryRaw<long>(sizeQuery).FirstOrDefaultAsync();

                // Tablo sayısı sorgusu
                var tableCountQuery = @"
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_TYPE = 'BASE TABLE'";
                
                var tableCount = await _context.Database.SqlQueryRaw<int>(tableCountQuery).FirstOrDefaultAsync();

                // Son yedekleme tarihi sorgusu
                var lastBackupQuery = @"
                    SELECT MAX(backup_finish_date) 
                    FROM msdb.dbo.backupset 
                    WHERE database_name = @dbName";
                
                var lastBackup = await _context.Database.SqlQueryRaw<DateTime?>(
                    lastBackupQuery, 
                    new Microsoft.Data.SqlClient.SqlParameter("@dbName", databaseName)
                ).FirstOrDefaultAsync() ?? DateTime.MinValue;

                // Veri istatistikleri
                var userCount = await _context.Users.CountAsync();
                var companyCount = await _context.Companies.CountAsync();
                var productCount = await _context.Products.CountAsync();
                var orderCount = await _context.Orders.CountAsync();

                // Veritabanı versiyonu
                var versionQuery = "SELECT @@VERSION";
                var version = await _context.Database.SqlQueryRaw<string>(versionQuery).FirstOrDefaultAsync();

                return new DatabaseStatusDto
                {
                    DatabaseName = databaseName,
                    Status = "Online",
                    SizeInMB = size,
                    TotalTables = tableCount,
                    TotalUsers = userCount,
                    TotalCompanies = companyCount,
                    TotalProducts = productCount,
                    TotalOrders = orderCount,
                    LastBackupDate = lastBackup,
                    BackupPath = GetLatestBackupPath(),
                    ServerVersion = version
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting database status");
                
                // Hata durumunda bazı temel bilgileri yine de dönelim
                return new DatabaseStatusDto
                {
                    Status = "Error getting full status",
                    DatabaseName = "TrackMate",
                    SizeInMB = 0,
                    TotalTables = 0,
                    TotalUsers = await _context.Users.CountAsync(),
                    TotalCompanies = await _context.Companies.CountAsync(),
                    TotalProducts = await _context.Products.CountAsync(),
                    TotalOrders = await _context.Orders.CountAsync(),
                    LastBackupDate = DateTime.MinValue,
                    ServerVersion = "Unknown"
                };
            }
        }

        private string GetLatestBackupPath()
        {
            try
            {
                var backupDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Backups");
                
                if (!Directory.Exists(backupDirectory))
                    return string.Empty;
                
                var latestBackup = Directory.GetFiles(backupDirectory, "*.bak")
                    .OrderByDescending(f => new FileInfo(f).CreationTime)
                    .FirstOrDefault();
                
                return latestBackup ?? string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }
    }
} 