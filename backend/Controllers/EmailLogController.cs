using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Exceptions;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmailLogController : BaseController
    {
        private readonly IEmailLogService _emailLogService;
        private readonly ILogger<EmailLogController> _logger;

        public EmailLogController(
            IEmailLogService emailLogService,
            ILogger<EmailLogController> logger)
        {
            _emailLogService = emailLogService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmailLogDto>>> GetAll()
        {
            try
            {
                var emailLogs = await _emailLogService.GetAllAsync();
                return Ok(emailLogs);
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message, code = ex.Code });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EmailLogDto>> GetById(int id)
        {
            try
            {
                var emailLog = await _emailLogService.GetByIdAsync(id);
                return Ok(emailLog);
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message, code = ex.Code });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<EmailLogDto>> Create([FromBody] CreateEmailLogDto dto)
        {
            if (!await ValidateCompanyAccess(dto.CompanyId))
                return Forbid();

            try
            {
                var emailLog = await _emailLogService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = emailLog.Id }, emailLog);
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message, code = ex.Code });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<EmailLogDto>> Update(int id, [FromBody] UpdateEmailLogDto dto)
        {
            var emailLog = await _emailLogService.GetByIdAsync(id);
            
            if (!await ValidateCompanyAccess(emailLog.CompanyId))
                return Forbid();

            try
            {
                var result = await _emailLogService.UpdateAsync(id, dto);
                return Ok(result);
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message, code = ex.Code });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult> Delete(int id)
        {
            var emailLog = await _emailLogService.GetByIdAsync(id);
            
            if (!await ValidateCompanyAccess(emailLog.CompanyId))
                return Forbid();

            try
            {
                await _emailLogService.DeleteAsync(id);
                return NoContent();
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new { message = ex.Message, code = ex.Code });
            }
        }
    }
} 