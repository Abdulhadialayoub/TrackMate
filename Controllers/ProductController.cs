using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : BaseController
    {
        private readonly IProductService _productService;

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductDto createProductDto)
        {
            var product = await _productService.CreateProductAsync(createProductDto);
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            var product = await _productService.GetProductAsync(id);
            if (product == null)
                return NotFound();

            if (!IsAuthorizedForCompany(product.CompanyId))
                return Forbid();

            return Ok(product);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
        {
            var products = await _productService.GetProductsAsync();
            var authorizedProducts = products.Where(p => IsAuthorizedForCompany(p.CompanyId));
            return Ok(authorizedProducts);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<ProductDto>> UpdateProduct(int id, UpdateProductDto updateProductDto)
        {
            var product = await _productService.GetProductAsync(id);
            if (product == null)
                return NotFound();

            if (!IsAuthorizedForCompany(product.CompanyId))
                return Forbid();

            var updatedProduct = await _productService.UpdateProductAsync(id, updateProductDto);
            if (updatedProduct == null)
                return NotFound();

            return Ok(updatedProduct);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult> DeleteProduct(int id)
        {
            var product = await _productService.GetProductAsync(id);
            if (product == null)
                return NotFound();

            if (!IsAuthorizedForCompany(product.CompanyId))
                return Forbid();

            var result = await _productService.DeleteProductAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
} 