using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : BaseController
    {
        private readonly ICategoryService _categoryService;
        private readonly ILogger<CategoryController> _logger;

        public CategoryController(ICategoryService categoryService, ILogger<CategoryController> logger)
        {
            _categoryService = categoryService;
            _logger = logger;
        }

        // GET: api/Category
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
        {
            // Get CompanyId from the authenticated user's claims
            var companyIdClaim = User.FindFirst("companyId") ?? User.FindFirst("company_id");
            
            int companyId;
            // TEMPORARY TEST: Force companyId to 2 if claim is missing or invalid
            if (companyIdClaim == null || !int.TryParse(companyIdClaim.Value, out companyId))
            {
                _logger.LogWarning("User does not have a valid companyId claim. FORCING to 2 FOR TESTING.");
                companyId = 2; // <<< TEMPORARY HARDCODED VALUE FOR TESTING
                // return Unauthorized(new { message = "User company information is missing." }); 
            }

            _logger.LogInformation("Requesting categories for company {CompanyId} (May be forced for test)", companyId);
            return await ExecuteAsync(async () => await _categoryService.GetAllAsync(companyId));
        }

        // GET: api/Category/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetById(int id)
        {
            _logger.LogInformation("Received request to get category with ID {CategoryId}", id);
            // Assuming categories are global or company scope is handled in service/globally
            return await ExecuteAsync(async () => await _categoryService.GetByIdAsync(id));
        }

        // POST: api/Category
        [HttpPost]
        [Authorize(Roles = "dev,Dev,Admin")] // Allow both dev and Dev, plus Admin
        public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            _logger.LogInformation("Received request to create a new category for company {CompanyId}", createDto.CompanyId);

            // Assuming category creation needs validation against the CompanyId in the DTO
            // You might need to adjust validation based on your authorization/scoping rules
            // (e.g., ensuring the logged-in user belongs to the companyId)
            return await ExecuteCreateAsync(
                async () => await _categoryService.CreateAsync(createDto),
                nameof(GetAll), // Or a future GetById endpoint if you create one
                new { /* route values for GetById if used */ } 
            );
        }

        // PUT: api/Category/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "dev,Dev,Admin")] // Allow both dev and Dev, plus Admin
        public async Task<ActionResult<CategoryDto>> Update(int id, [FromBody] UpdateCategoryDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            _logger.LogInformation("Received request to update category with ID {CategoryId}", id);
            // Add company scope validation if needed, e.g., check if category belongs to user's company
            return await ExecuteAsync(async () => await _categoryService.UpdateAsync(id, updateDto));
        }

        // DELETE: api/Category/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "dev,Dev,Admin")] // Allow both dev and Dev, plus Admin
        public async Task<IActionResult> Delete(int id)
        {
            _logger.LogInformation("Received request to delete category with ID {CategoryId}", id);
            // Add company scope validation if needed
            await _categoryService.DeleteAsync(id); // Use ExecuteAsync if you want standardized error handling
            return NoContent(); // Standard response for successful DELETE
        }
    }
} 