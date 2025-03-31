using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmailLogController : BaseController
    {
        private readonly IEmailLogService _emailLogService;

        public EmailLogController(IEmailLogService emailLogService)
        {
            _emailLogService = emailLogService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<EmailLogDto>> CreateEmailLog(CreateEmailLogDto createEmailLogDto)
        {
            var emailLog = await _emailLogService.CreateEmailLogAsync(createEmailLogDto);
            return CreatedAtAction(nameof(GetEmailLog), new { id = emailLog.Id }, emailLog);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EmailLogDto>> GetEmailLog(int id)
        {
            var emailLog = await _emailLogService.GetEmailLogAsync(id);
            if (emailLog == null)
                return NotFound();

            if (!IsAuthorizedForCompany(emailLog.CompanyId))
                return Forbid();

            return Ok(emailLog);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmailLogDto>>> GetEmailLogs()
        {
            var emailLogs = await _emailLogService.GetEmailLogsAsync();
            var authorizedEmailLogs = emailLogs.Where(e => IsAuthorizedForCompany(e.CompanyId));
            return Ok(authorizedEmailLogs);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<EmailLogDto>> UpdateEmailLog(int id, UpdateEmailLogDto updateEmailLogDto)
        {
            var emailLog = await _emailLogService.GetEmailLogAsync(id);
            if (emailLog == null)
                return NotFound();

            if (!IsAuthorizedForCompany(emailLog.CompanyId))
                return Forbid();

            var updatedEmailLog = await _emailLogService.UpdateEmailLogAsync(id, updateEmailLogDto);
            if (updatedEmailLog == null)
                return NotFound();

            return Ok(updatedEmailLog);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult> DeleteEmailLog(int id)
        {
            var emailLog = await _emailLogService.GetEmailLogAsync(id);
            if (emailLog == null)
                return NotFound();

            if (!IsAuthorizedForCompany(emailLog.CompanyId))
                return Forbid();

            var result = await _emailLogService.DeleteEmailLogAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
} 