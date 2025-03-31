using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Services;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CompanyController : BaseController
    {
        private readonly ICompanyService _companyService;

        public CompanyController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<CompanyDto>> CreateCompany([FromBody] CreateCompanyDto createCompanyDto)
        {
            try
            {
                var company = await _companyService.CreateCompanyAsync(createCompanyDto);
                return CreatedAtAction(nameof(GetCompany), new { id = company.Id }, company);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompanyDto>>> GetCompanies()
        {
            try
            {
                var userRole = GetCurrentUserRole();
                var userCompanyId = GetCurrentUserCompanyId();

                var companies = await _companyService.GetCompaniesAsync();
                
                // Dev rolü tüm şirketleri görebilir
                if (userRole == "Dev")
                {
                    return Ok(companies);
                }

                // Admin ve User sadece kendi şirketlerini görebilir
                var filteredCompanies = companies.Where(c => c.Id == userCompanyId);
                return Ok(filteredCompanies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CompanyDto>> GetCompany(int id)
        {
            try
            {
                var userRole = GetCurrentUserRole();
                var userCompanyId = GetCurrentUserCompanyId();

                // Dev rolü herhangi bir şirketi görüntüleyebilir
                if (userRole != "Dev" && userCompanyId != id)
                {
                    return Forbid();
                }

                var company = await _companyService.GetCompanyAsync(id);
                if (company == null)
                {
                    return NotFound($"Company with ID {id} not found.");
                }

                if (!IsAuthorizedForCompany(company.Id))
                {
                    return Forbid();
                }

                return Ok(company);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<CompanyDto>> UpdateCompany(int id, [FromBody] UpdateCompanyDto updateCompanyDto)
        {
            try
            {
                var userRole = GetCurrentUserRole();
                var userCompanyId = GetCurrentUserCompanyId();

                // Dev rolü herhangi bir şirketi güncelleyebilir
                if (userRole != "Dev" && userCompanyId != id)
                {
                    return Forbid();
                }

                if (!IsAuthorizedForCompany(id))
                {
                    return Forbid();
                }

                var company = await _companyService.UpdateCompanyAsync(id, updateCompanyDto);
                if (company == null)
                {
                    return NotFound($"Company with ID {id} not found.");
                }

                return Ok(company);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Dev")]
        public async Task<ActionResult> DeleteCompany(int id)
        {
            try
            {
                var userRole = GetCurrentUserRole();
                var userCompanyId = GetCurrentUserCompanyId();

                // Dev rolü herhangi bir şirketi silmeye yetkili
                if (userRole != "Dev" && userCompanyId != id)
                {
                    return Forbid();
                }

                if (!IsAuthorizedForCompany(id))
                {
                    return Forbid();
                }

                var result = await _companyService.DeleteCompanyAsync(id);
                if (!result)
                {
                    return NotFound($"Company with ID {id} not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
} 