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
        private readonly ICompanyBankDetailService _bankDetailService;
        private readonly ILogger<CompanyBankDetailController> _logger;

        public CompanyBankDetailController(
            ICompanyBankDetailService bankDetailService,
            ILogger<CompanyBankDetailController> logger)
        {
            _bankDetailService = bankDetailService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<CompanyBankDetailDto>> CreateBankDetail([FromBody] CreateCompanyBankDetailDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            return await ExecuteWithValidationAsync(
                dto.CompanyId,
                async () =>
                {
                    dto.CreatedBy = GetUserEmail();
                    return await _bankDetailService.CreateAsync(dto);
                }
            );
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CompanyBankDetailDto>> GetBankDetail(int id)
        {
            var bankDetail = await _bankDetailService.GetByIdAsync(id);
            if (bankDetail == null)
            {
                return NotFound(new { message = "Bank detail not found", code = "BANK_DETAIL_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                bankDetail.CompanyId,
                async () => bankDetail
            );
        }

        [HttpGet("company/{companyId}")]
        public async Task<ActionResult<IEnumerable<CompanyBankDetailDto>>> GetBankDetails(int companyId)
        {
            return await ExecuteWithValidationAsync(
                companyId,
                async () => await _bankDetailService.GetByCompanyIdAsync(companyId)
            );
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CompanyBankDetailDto>> UpdateBankDetail(int id, [FromBody] UpdateCompanyBankDetailDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingBankDetail = await _bankDetailService.GetByIdAsync(id);
            if (existingBankDetail == null)
            {
                return NotFound(new { message = "Bank detail not found", code = "BANK_DETAIL_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                existingBankDetail.CompanyId,
                async () =>
                {
                    dto.UpdatedBy = GetUserEmail();
                    return await _bankDetailService.UpdateAsync(id, dto);
                }
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBankDetail(int id)
        {
            var bankDetail = await _bankDetailService.GetByIdAsync(id);
            if (bankDetail == null)
            {
                return NotFound(new { message = "Bank detail not found", code = "BANK_DETAIL_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                bankDetail.CompanyId,
                async () => await _bankDetailService.DeleteAsync(id)
            );
        }
    }
} 