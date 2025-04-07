using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Interfaces
{
    public interface IProductService : IBaseService<Product, ProductDto, CreateProductDto, UpdateProductDto>
    {
        Task<IEnumerable<ProductDto>> GetProductsAsync();
        Task<ProductDto> GetProductByIdAsync(int id);
        Task<IEnumerable<ProductDto>> GetProductsByCompanyIdAsync(int companyId);
        Task<ProductDto> CreateProductAsync(CreateProductDto dto);
        Task<ProductDto> UpdateProductAsync(int id, UpdateProductDto dto);
        Task<ProductDto> UpdateProductQuantityAsync(int id, int quantity);
        Task DeleteProductAsync(int id);
        Task<IEnumerable<ProductDto>> GetByCategoryIdAsync(int categoryId);
        Task<ProductDto> UpdateStockAsync(int id, int quantity);
        Task<ProductDto> UpdateStatusAsync(int id, ProductStatus status);
        new Task<IEnumerable<ProductDto>> GetByCompanyIdAsync(int companyId);
        new Task<ProductDto> GetByIdAsync(int id);
    }
} 