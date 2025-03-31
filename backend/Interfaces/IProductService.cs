using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IProductService
    {
        Task<ProductDto> CreateProductAsync(CreateProductDto createProductDto);
        Task<ProductDto?> GetProductAsync(int id);
        Task<IEnumerable<ProductDto>> GetProductsAsync();
        Task<ProductDto?> UpdateProductAsync(int id, UpdateProductDto updateProductDto);
        Task<bool> DeleteProductAsync(int id);
    }
} 