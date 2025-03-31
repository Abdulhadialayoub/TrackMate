using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CompanyBankDetailController : BaseController
    {
        private readonly ICompanyBankDetailService _companyBankDetailService;

        public CompanyBankDetailController(ICompanyBankDetailService companyBankDetailService)
        {
            _companyBankDetailService = companyBankDetailService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<CompanyBankDetailDto>> CreateCompanyBankDetail(CreateCompanyBankDetailDto createCompanyBankDetailDto)
        {
            var bankDetail = await _companyBankDetailService.CreateCompanyBankDetailAsync(createCompanyBankDetailDto);
            return CreatedAtAction(nameof(GetCompanyBankDetail), new { id = bankDetail.Id }, bankDetail);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CompanyBankDetailDto>> GetCompanyBankDetail(int id)
        {
            var bankDetail = await _companyBankDetailService.GetCompanyBankDetailAsync(id);
            if (bankDetail == null)
                return NotFound();

            if (!IsAuthorizedForCompany(bankDetail.CompanyId))
                return Forbid();

            return Ok(bankDetail);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompanyBankDetailDto>>> GetCompanyBankDetails()
        {
            var bankDetails = await _companyBankDetailService.GetCompanyBankDetailsAsync();
            var authorizedBankDetails = bankDetails.Where(b => IsAuthorizedForCompany(b.CompanyId));
            return Ok(authorizedBankDetails);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<CompanyBankDetailDto>> UpdateCompanyBankDetail(int id, UpdateCompanyBankDetailDto updateCompanyBankDetailDto)
        {
            var bankDetail = await _companyBankDetailService.GetCompanyBankDetailAsync(id);
            if (bankDetail == null)
                return NotFound();

            if (!IsAuthorizedForCompany(bankDetail.CompanyId))
                return Forbid();

            var updatedBankDetail = await _companyBankDetailService.UpdateCompanyBankDetailAsync(id, updateCompanyBankDetailDto);
            if (updatedBankDetail == null)
                return NotFound();

            return Ok(updatedBankDetail);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult> DeleteCompanyBankDetail(int id)
        {
            var bankDetail = await _companyBankDetailService.GetCompanyBankDetailAsync(id);
            if (bankDetail == null)
                return NotFound();

            if (!IsAuthorizedForCompany(bankDetail.CompanyId))
                return Forbid();

            var result = await _companyBankDetailService.DeleteCompanyBankDetailAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
} 