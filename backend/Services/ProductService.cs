using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Services
{
    public class ProductService : BaseService<Product, ProductDto, CreateProductDto, UpdateProductDto>, IProductService
    {
        public ProductService(TrackMateDbContext context, IMapper mapper, ILogger<ProductService> logger)
            : base(context, mapper, logger)
        {
        }

        public async Task<IEnumerable<ProductDto>> GetProductsAsync()
        {
            return await GetAllAsync();
        }

        public async Task<ProductDto> GetProductByIdAsync(int id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<IEnumerable<ProductDto>> GetProductsByCompanyIdAsync(int companyId)
        {
            return await GetByCompanyIdAsync(companyId);
        }

        protected override async Task<Product> GetEntityByIdAsync(int id)
        {
            return await _dbSet
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        }

        public async Task<IEnumerable<ProductDto>> GetByCategoryIdAsync(int categoryId)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.CategoryId == categoryId && !p.IsDeleted)
                .ToListAsync();

            return _mapper.Map<IEnumerable<ProductDto>>(products);
        }

        public async Task<ProductDto> UpdateStockAsync(int id, int quantity)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null || product.IsDeleted)
                return null;

            product.StockQuantity = quantity;
            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return _mapper.Map<ProductDto>(product);
        }

        public async Task<ProductDto> UpdateStatusAsync(int id, ProductStatus status)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null || product.IsDeleted)
                return null;

            product.Status = status;
            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();

            return _mapper.Map<ProductDto>(product);
        }

        public async Task<ProductDto> CreateProductAsync(CreateProductDto dto)
        {
            // Validate company exists
            var company = await _context.Companies.FindAsync(dto.CompanyId);
            if (company == null)
                throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");

            // Validate SKU uniqueness within company
            if (await _dbSet.AnyAsync(p => p.CompanyId == dto.CompanyId && p.SKU == dto.SKU && !p.IsDeleted))
                throw new ApiException("Product with this SKU already exists", 400, "DUPLICATE_SKU");

            return await CreateAsync(dto);
        }

        public async Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto dto)
        {
            var existingProduct = await GetEntityByIdAsync(id);
            if (existingProduct == null)
                throw new ApiException("Product not found", 404, "PRODUCT_NOT_FOUND");

            // Validate SKU uniqueness within company
            if (await _dbSet.AnyAsync(p => p.CompanyId == existingProduct.CompanyId && p.SKU == dto.SKU && p.Id != id && !p.IsDeleted))
                throw new ApiException("Product with this SKU already exists", 400, "DUPLICATE_SKU");

            return await UpdateAsync(id, dto);
        }

        public async Task<ProductDto> UpdateProductQuantityAsync(int id, int quantity)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                throw new ApiException("Product not found", 404, "PRODUCT_NOT_FOUND");

            product.Quantity = quantity;
            product.UpdatedAt = DateTime.UtcNow;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();
            return _mapper.Map<ProductDto>(product);
        }

        public async Task DeleteProductAsync(int id)
        {
            // Check if product is used in any order
            var isUsedInOrder = await _context.OrderItems.AnyAsync(oi => oi.ProductId == id);
            if (isUsedInOrder)
                throw new ApiException("Cannot delete product that is used in orders", 400, "PRODUCT_IN_USE");

            await DeleteAsync(id);
        }
    }
} 