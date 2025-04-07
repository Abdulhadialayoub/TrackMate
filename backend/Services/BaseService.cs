using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TrackMate.API.Data;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Services
{
    public abstract class BaseService<TEntity, TDto, TCreateDto, TUpdateDto> : IBaseService<TEntity, TDto, TCreateDto, TUpdateDto>
        where TEntity : BaseEntity
        where TDto : class
        where TCreateDto : class
        where TUpdateDto : class
    {
        protected readonly TrackMateDbContext _context;
        protected readonly DbSet<TEntity> _dbSet;
        protected readonly IMapper _mapper;
        protected readonly ILogger<BaseService<TEntity, TDto, TCreateDto, TUpdateDto>> _logger;

        protected BaseService(TrackMateDbContext context, IMapper mapper, ILogger<BaseService<TEntity, TDto, TCreateDto, TUpdateDto>> logger)
        {
            _context = context;
            _dbSet = _context.Set<TEntity>();
            _mapper = mapper;
            _logger = logger;
        }

        public virtual async Task<IEnumerable<TDto>> GetAllAsync()
        {
            try
            {
                _logger.LogInformation($"Fetching all {typeof(TEntity).Name}s");
                var entities = await _dbSet
                    .Where(e => !e.IsDeleted)
                    .ToListAsync();
                return _mapper.Map<IEnumerable<TDto>>(entities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching all {typeof(TEntity).Name}s");
                throw;
            }
        }

        public virtual async Task<TDto> GetByIdAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Fetching {typeof(TEntity).Name} by ID: {id}");
                var entity = await GetEntityByIdAsync(id);
                
                if (entity == null)
                    return null;

                return _mapper.Map<TDto>(entity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching {typeof(TEntity).Name} by ID: {id}");
                throw;
            }
        }

        public virtual async Task<IEnumerable<TDto>> GetByCompanyIdAsync(int companyId)
        {
            try
            {
                _logger.LogInformation($"Fetching {typeof(TEntity).Name}s for company: {companyId}");
                var entities = await _dbSet
                    .Where(e => e.CompanyId == companyId && !e.IsDeleted)
                    .ToListAsync();
                return _mapper.Map<IEnumerable<TDto>>(entities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching {typeof(TEntity).Name}s for company: {companyId}");
                throw;
            }
        }

        public virtual async Task<TDto> CreateAsync(TCreateDto createDto)
        {
            try
            {
                _logger.LogInformation($"Creating new {typeof(TEntity).Name}");
                var entity = _mapper.Map<TEntity>(createDto);
                entity.CreatedAt = DateTime.UtcNow;
                entity.IsActive = true;

                await _dbSet.AddAsync(entity);
                await _context.SaveChangesAsync();

                return _mapper.Map<TDto>(entity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating {typeof(TEntity).Name}");
                throw;
            }
        }

        public virtual async Task<TDto> UpdateAsync(int id, TUpdateDto updateDto)
        {
            try
            {
                _logger.LogInformation($"Updating {typeof(TEntity).Name}: {id}");
                var entity = await GetEntityByIdAsync(id);

                if (entity == null)
                    return null;

                _mapper.Map(updateDto, entity);
                entity.UpdatedAt = DateTime.UtcNow;

                _dbSet.Update(entity);
                await _context.SaveChangesAsync();

                return _mapper.Map<TDto>(entity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating {typeof(TEntity).Name}: {id}");
                throw;
            }
        }

        public virtual async Task<bool> DeleteAsync(int id)
        {
            try
            {
                _logger.LogInformation($"Deleting {typeof(TEntity).Name}: {id}");
                var entity = await _dbSet.FindAsync(id);

                if (entity == null)
                    return false;

                entity.IsDeleted = true;
                entity.UpdatedAt = DateTime.UtcNow;

                _dbSet.Update(entity);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting {typeof(TEntity).Name}: {id}");
                throw;
            }
        }

        public virtual async Task<TDto> UpdateStatusAsync(int id, bool isActive)
        {
            try
            {
                _logger.LogInformation($"Updating status of {typeof(TEntity).Name}: {id}");
                var entity = await GetEntityByIdAsync(id);
                
                if (entity == null)
                    return null;

                entity.IsActive = isActive;
                entity.UpdatedAt = DateTime.UtcNow;

                _dbSet.Update(entity);
                await _context.SaveChangesAsync();

                return _mapper.Map<TDto>(entity);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating status of {typeof(TEntity).Name}: {id}");
                throw;
            }
        }

        protected virtual async Task<TEntity> GetEntityByIdAsync(int id)
        {
            return await _dbSet
                .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
        }
    }
} 