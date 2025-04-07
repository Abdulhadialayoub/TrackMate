using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IBaseService<TEntity, TDto, TCreateDto, TUpdateDto>
        where TEntity : class
        where TDto : class
        where TCreateDto : class
        where TUpdateDto : class
    {
        Task<IEnumerable<TDto>> GetAllAsync();
        Task<TDto> GetByIdAsync(int id);
        Task<IEnumerable<TDto>> GetByCompanyIdAsync(int companyId);
        Task<TDto> CreateAsync(TCreateDto createDto);
        Task<TDto> UpdateAsync(int id, TUpdateDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<TDto> UpdateStatusAsync(int id, bool isActive);
    }
} 