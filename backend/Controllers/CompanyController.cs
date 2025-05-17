using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;
using TrackMate.API.Exceptions;
using Microsoft.Extensions.Logging;
using TrackMate.API.Services;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CompanyController : BaseController
    {
        private readonly ICompanyService _companyService;
        private readonly ILogger<CompanyController> _logger;

        public CompanyController(
            ICompanyService companyService,
            ILogger<CompanyController> logger)
        {
            _companyService = companyService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompanyDto>>> GetAll()
        {
            try
            {
                // Dev rolü kontrolü
                var userRole = GetUserRole();
                _logger.LogInformation($"User with role {userRole} requested all companies");
                
                // Sadece Dev rolü için izin kontrolünü atlama
                if (userRole != "Dev")
                {
                    try
                    {
                        // Check permission
                        RequirePermission(Permissions.ViewCompanies);
                        _logger.LogInformation($"Permission check passed for user with role {userRole}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Permission check failed for user with role {userRole}");
                        return StatusCode(403, new { message = "You don't have permission to view companies", error = ex.Message });
                    }
                }
                
                var companies = await _companyService.GetAllAsync();
                _logger.LogInformation($"Returning {companies.Count()} companies");
                return Ok(companies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAll companies");
                return StatusCode(500, new { message = "An error occurred while retrieving companies", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CompanyDto>> GetById(int id)
        {
            // Check permission
            RequirePermission(Permissions.ViewCompanies);
            
            return await ExecuteAsync(async () => await _companyService.GetByIdAsync(id));
        }

        [HttpPost]
        public async Task<ActionResult<CompanyDto>> Create([FromBody] CreateCompanyDto createCompanyDto)
        {
            // Check permission
            RequirePermission(Permissions.CreateCompany);
            
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var createdCompany = await _companyService.CreateAsync(createCompanyDto);
            
            return await ExecuteCreateAsync(
                async () => createdCompany,
                nameof(GetById),
                new { id = createdCompany.Id }
            );
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CompanyDto>> Update(int id, [FromBody] UpdateCompanyDto updateCompanyDto)
        {
            // Check permission
            RequirePermission(Permissions.UpdateCompany);
            
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var company = await _companyService.GetByIdAsync(id);
            if (company == null)
            {
                return NotFound(new { message = "Company not found", code = "COMPANY_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                company.Id,
                async () => await _companyService.UpdateAsync(id, updateCompanyDto)
            );
        }

        [HttpPut("{id}/profile")]
        public async Task<ActionResult<CompanyDto>> UpdateProfile(int id, [FromBody] UpdateCompanyDto updateCompanyDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var company = await _companyService.GetByIdAsync(id);
            if (company == null)
            {
                return NotFound(new { message = "Company not found", code = "COMPANY_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                company.Id,
                async () => await _companyService.UpdateCompanyProfileAsync(id, updateCompanyDto)
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var company = await _companyService.GetByIdAsync(id);
            if (company == null)
            {
                return NotFound(new { message = "Company not found", code = "COMPANY_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                company.Id,
                async () => await _companyService.DeleteAsync(id)
            );
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<CompanyDto>> UpdateStatus(int id, [FromBody] UpdateCompanyStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var company = await _companyService.GetByIdAsync(id);
            if (company == null)
            {
                return NotFound(new { message = "Company not found", code = "COMPANY_NOT_FOUND" });
            }

            // Convert IsActive boolean to status string
            string status = statusDto.IsActive ? "Active" : "Inactive";

            return await ExecuteWithValidationAsync(
                company.Id,
                async () => await _companyService.UpdateStatusAsync(id, status)
            );
        }
    }
} 