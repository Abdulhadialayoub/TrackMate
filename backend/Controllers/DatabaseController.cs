using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Enums;
using System.Linq;
using System.Collections.Generic;

namespace TrackMate.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DatabaseController : BaseController
    {
        private readonly IDatabaseService _databaseService;
        private readonly ILogger<DatabaseController> _logger;

        public DatabaseController(
            IDatabaseService databaseService,
            ILogger<DatabaseController> logger)
        {
            _databaseService = databaseService;
            _logger = logger;
        }

        [HttpGet("status")]
        [Authorize(Roles = "Dev,Admin")]
        public async Task<IActionResult> GetDatabaseStatus()
        {
            try
            {
                var status = await _databaseService.GetDatabaseStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting database status");
                return StatusCode(500, "An error occurred while retrieving database status");
            }
        }

        [HttpPost("backup")]
        [Authorize(Roles = "Dev")]
        public async Task<IActionResult> BackupDatabase()
        {
            try
            {
                var backupPath = await _databaseService.BackupDatabaseAsync();
                return Ok(new { 
                    message = "Database backup created successfully", 
                    backupPath = backupPath,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error backing up database");
                return StatusCode(500, "An error occurred while backing up the database");
            }
        }

        [HttpPost("restore")]
        [Authorize(Roles = "Dev")]
        public async Task<IActionResult> RestoreDatabase(IFormFile backupFile)
        {
            try
            {
                if (backupFile == null)
                {
                    return BadRequest("No backup file provided");
                }

                // Check file extension
                var extension = Path.GetExtension(backupFile.FileName).ToLowerInvariant();
                if (extension != ".bak" && extension != ".sql" && extension != ".backup")
                {
                    return BadRequest("Invalid backup file format. Only .bak, .sql, and .backup files are allowed.");
                }

                // Save file to a temporary location
                var tempFilePath = Path.GetTempFileName();
                using (var stream = new FileStream(tempFilePath, FileMode.Create))
                {
                    await backupFile.CopyToAsync(stream);
                }

                // Restore database
                await _databaseService.RestoreDatabaseAsync(tempFilePath);
                
                // Delete temporary file
                System.IO.File.Delete(tempFilePath);

                return Ok(new { message = "Database restored successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring database");
                return StatusCode(500, "An error occurred while restoring the database");
            }
        }

        [HttpPost("reset")]
        [Authorize(Roles = "Dev")]
        public async Task<IActionResult> ResetDatabase()
        {
            try
            {
                await _databaseService.ResetDatabaseAsync();
                return Ok(new { message = "Database reset successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting database");
                return StatusCode(500, "An error occurred while resetting the database");
            }
        }

        [HttpGet("backup/download/{fileName}")]
        [Authorize(Roles = "Dev")]
        public ActionResult DownloadBackup(string fileName)
        {
            try
            {
                var backupDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Backups");
                var filePath = Path.Combine(backupDirectory, fileName);
                
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound($"Backup file '{fileName}' not found");
                }
                
                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                return File(fileBytes, "application/octet-stream", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading backup file");
                return StatusCode(500, "An error occurred while downloading the backup file");
            }
        }

        [HttpGet("backup/list")]
        [Authorize(Roles = "Dev")]
        public ActionResult GetBackupsList()
        {
            try
            {
                var backupDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Backups");
                
                if (!Directory.Exists(backupDirectory))
                {
                    Directory.CreateDirectory(backupDirectory);
                    return Ok(new { backups = new List<object>() });
                }
                
                var backupFiles = Directory.GetFiles(backupDirectory, "*.bak")
                    .Select(file => new 
                    {
                        fileName = Path.GetFileName(file),
                        createdAt = System.IO.File.GetCreationTime(file),
                        fileSizeKB = new FileInfo(file).Length / 1024,
                        downloadUrl = $"/api/database/backup/download/{Path.GetFileName(file)}"
                    })
                    .OrderByDescending(f => f.createdAt)
                    .ToList();
                
                return Ok(new { backups = backupFiles });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting backup files list");
                return StatusCode(500, "An error occurred while getting the backup files list");
            }
        }
    }

    public class RestoreRequestDto
    {
        public string BackupFilePath { get; set; }
    }
} 