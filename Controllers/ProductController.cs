using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;
using TrackMate.API.Exceptions;
using Microsoft.Extensions.Logging;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : BaseController
    {
        private readonly IProductService _productService;
        private readonly ILogger<ProductController> _logger;

        public ProductController(
            IProductService productService,
            ILogger<ProductController> logger)
        {
            _productService = productService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
        {
            return await ExecuteAsync(async () => await _productService.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetById(int id)
        {
            return await ExecuteAsync(async () => await _productService.GetByIdAsync(id));
        }

        [HttpGet("company/{companyId}")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetByCompanyId(int companyId)
        {
            return await ExecuteWithValidationAsync(
                companyId,
                async () => await _productService.GetByCompanyIdAsync(companyId)
            );
        }

        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetByCategoryId(int categoryId)
        {
            var product = await _productService.GetByIdAsync(categoryId);
            if (product == null)
            {
                return NotFound(new { message = "Category not found", code = "CATEGORY_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                product.CompanyId,
                async () => await _productService.GetByCategoryIdAsync(categoryId)
            );
        }

        [HttpPost]
        public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto createProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            return await ExecuteCreateAsync(
                async () => await _productService.CreateAsync(createProductDto),
                nameof(GetById),
                new { id = 0 }
            );
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] UpdateProductDto updateProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var product = await _productService.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found", code = "PRODUCT_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                product.CompanyId,
                async () => await _productService.UpdateAsync(id, updateProductDto)
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found", code = "PRODUCT_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                product.CompanyId,
                async () => await _productService.DeleteAsync(id)
            );
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<ProductDto>> UpdateStatus(int id, [FromBody] UpdateProductStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var product = await _productService.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found", code = "PRODUCT_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                product.CompanyId,
                async () => await _productService.UpdateStatusAsync(id, statusDto.Status)
            );
        }

        [HttpPut("{id}/stock")]
        public async Task<ActionResult<ProductDto>> UpdateStock(int id, [FromBody] UpdateProductStockDto stockDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var product = await _productService.GetByIdAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Product not found", code = "PRODUCT_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                product.CompanyId,
                async () => await _productService.UpdateStockAsync(id, stockDto.Quantity)
            );
        }
    }
} 