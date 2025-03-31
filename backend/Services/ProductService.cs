using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Services
{
    public class ProductService : IProductService
    {
        private readonly TrackMateDbContext _context;

        public ProductService(TrackMateDbContext context)
        {
            _context = context;
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto createProductDto)
        {
            var product = new Product
            {
                Name = createProductDto.Name,
                Description = createProductDto.Description,
                Price = createProductDto.Price,
                CompanyId = createProductDto.CompanyId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                CompanyId = product.CompanyId,
                CompanyName = product.Company?.Name ?? string.Empty,
                CreatedDate = product.CreatedDate
            };
        }

        public async Task<ProductDto?> GetProductAsync(int id)
        {
            var product = await _context.Products
                .Include(p => p.Company)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return null;

            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                CompanyId = product.CompanyId,
                CompanyName = product.Company?.Name ?? string.Empty,
                CreatedDate = product.CreatedDate
            };
        }

        public async Task<IEnumerable<ProductDto>> GetProductsAsync()
        {
            var products = await _context.Products
                .Include(p => p.Company)
                .ToListAsync();

            return products.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                CompanyId = p.CompanyId,
                CompanyName = p.Company?.Name ?? string.Empty,
                CreatedDate = p.CreatedDate
            });
        }

        public async Task<ProductDto?> UpdateProductAsync(int id, UpdateProductDto updateProductDto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return null;

            product.Name = updateProductDto.Name;
            product.Description = updateProductDto.Description;
            product.Price = updateProductDto.Price;
            product.CompanyId = updateProductDto.CompanyId;

            await _context.SaveChangesAsync();

            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                CompanyId = product.CompanyId,
                CompanyName = product.Company?.Name ?? string.Empty,
                CreatedDate = product.CreatedDate
            };
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return false;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 