using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;
using TrackMate.API.Exceptions;
using Microsoft.Extensions.Logging;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : BaseController
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(
            IUserService userService,
            ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAll()
        {
            try
            {
                // Dev rolü tüm kullanıcıları görebilir
                var userRole = GetUserRole();
                _logger.LogInformation($"User with role {userRole} requested all users");
                
                if (userRole == "Dev")
                {
                    try 
                    {
                        var allUsers = await _userService.GetAllAsync();
                        if (allUsers == null)
                        {
                            _logger.LogWarning("GetAllAsync returned null");
                            return Ok(new List<UserDto>());
                        }
                        
                        _logger.LogInformation($"Returning {allUsers.Count()} users for Dev role");
                        return Ok(allUsers);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error in _userService.GetAllAsync()");
                        return StatusCode(500, new { message = "An error occurred in the user service", error = ex.Message });
                    }
                }
                else
                {
                    // Dev olmayan roller sadece kendi şirketlerindeki kullanıcıları görebilir
                    try
                    {
                        int companyId = GetCompanyId();
                        _logger.LogInformation($"User with role {userRole} and company {companyId} requested users");
                        
                        var companyUsers = await _userService.GetByCompanyIdAsync(companyId);
                        if (companyUsers == null)
                        {
                            _logger.LogWarning($"GetByCompanyIdAsync for company {companyId} returned null");
                            return Ok(new List<UserDto>());
                        }
                        
                        _logger.LogInformation($"Returning {companyUsers.Count()} users for company {companyId}");
                        return Ok(companyUsers);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error in _userService.GetByCompanyIdAsync()");
                        return StatusCode(500, new { message = "An error occurred retrieving company users", error = ex.Message });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAll users");
                return StatusCode(500, new { message = "An error occurred while retrieving users", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetById(int id)
        {
            return await ExecuteAsync(async () => await _userService.GetByIdAsync(id));
        }

        [HttpGet("company/{companyId}")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetByCompanyId(int companyId)
        {
            return await ExecuteWithValidationAsync(
                companyId,
                async () => await _userService.GetByCompanyIdAsync(companyId)
            );
        }

        [HttpPost]
        public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto createUserDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            return await ExecuteCreateAsync(
                async () => await _userService.CreateAsync(createUserDto),
                nameof(GetById),
                new { id = createUserDto.Id }
            );
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<UserDto>> Update(int id, [FromBody] UpdateUserDto updateUserDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found", code = "USER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                user.CompanyId,
                async () => await _userService.UpdateAsync(id, updateUserDto)
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found", code = "USER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                user.CompanyId,
                async () => await _userService.DeleteAsync(id)
            );
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<UserDto>> UpdateStatus(int id, [FromBody] UpdateUserStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found", code = "USER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                user.CompanyId,
                async () => await _userService.UpdateStatusAsync(id, statusDto.IsActive)
            );
        }

        [HttpPut("{id}/password")]
        public async Task<IActionResult> UpdatePassword(int id, [FromBody] UpdatePasswordDto passwordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found", code = "USER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                user.CompanyId,
                async () => await _userService.UpdatePasswordAsync(id, passwordDto.CurrentPassword, passwordDto.NewPassword)
            );
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleDto roleDto)
        {
            try
            {
                _logger.LogInformation($"Updating role for user {id} to {roleDto.Role}");
                
                if (string.IsNullOrEmpty(roleDto.Role))
                {
                    return BadRequest(new { message = "Role is required", code = "ROLE_REQUIRED" });
                }
                
                var user = await _userService.GetByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found", code = "USER_NOT_FOUND" });
                }
                
                // Kaynak koruması için kullanıcının şirketine erişim kontrolü
                if (!await ValidateCompanyAccess(user.CompanyId))
                {
                    return Forbid();    
                }
                
                // Dev rolü sadece başka bir Dev tarafından atanabilir
                if (roleDto.Role == "Dev" && GetUserRole() != "Dev")
                {
                    return Forbid();
                }
                
                // UserService'de bu metodu implemente edildiğinden emin olun
                var updatedUser = await _userService.UpdateRoleAsync(id, roleDto.Role);
                
                return Ok(updatedUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating role for user {id}");
                return StatusCode(500, new { message = $"An error occurred while updating the user role: {ex.Message}", code = "INTERNAL_SERVER_ERROR" });
            }
        }
    }
}