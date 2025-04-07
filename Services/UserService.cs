using Microsoft.EntityFrameworkCore;
using TrackMate.API.Services;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;
using BC = BCrypt.Net.BCrypt;
using Microsoft.Extensions.Logging;
using TrackMate.API.Exceptions;
using AutoMapper;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Services
{
    public class UserService : BaseService<User, UserDto, CreateUserDto, UpdateUserDto>, IUserService
    {
        private readonly new IMapper _mapper;

        public UserService(TrackMateDbContext context, IMapper mapper, ILogger<UserService> logger)
            : base(context, mapper, logger)
        {
            _mapper = mapper;
        }

        protected override async Task<User> GetEntityByIdAsync(int id)
        {
            return await _dbSet
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
        }

        public override async Task<IEnumerable<UserDto>> GetByCompanyIdAsync(int companyId)
        {
            try
            {
                _logger.LogInformation("Fetching users for company: {CompanyId}", companyId);

                var users = await _dbSet
                    .Include(u => u.Company)
                    .Where(u => u.CompanyId == companyId && !u.IsDeleted)
                    .ToListAsync();

                return _mapper.Map<IEnumerable<UserDto>>(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching users for company: {CompanyId}", companyId);
                throw;
            }
        }

        public async Task<UserDto> GetUserByEmailAsync(string email)
        {
            try
            {
                _logger.LogInformation("Fetching user by email: {Email}", email);

                var user = await _dbSet
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);

                if (user == null)
                {
                    throw new ApiException("User not found", 404, "USER_NOT_FOUND");
                }

                return _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user by email: {Email}", email);
                throw;
            }
        }

        public override async Task<UserDto> CreateAsync(CreateUserDto dto)
        {
            try
            {
                _logger.LogInformation("Creating new user: {Email}", dto.Email);

                var company = await _context.Companies
                    .FirstOrDefaultAsync(c => c.Id == dto.CompanyId && !c.IsDeleted);

                if (company == null)
                {
                    throw new ApiException("Company not found", 404, "COMPANY_NOT_FOUND");
                }

                if (await _dbSet.AnyAsync(u => u.Email == dto.Email && !u.IsDeleted))
                {
                    throw new ApiException("Email already exists", 400, "EMAIL_EXISTS");
                }

                var user = _mapper.Map<User>(dto);
                user.PasswordHash = BC.HashPassword(dto.Password);
                user.IsActive = true;
                user.CreatedAt = DateTime.UtcNow;
                
                // Set default values to avoid NULL constraint violations
                user.RefreshToken = Guid.NewGuid().ToString();
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7); // Set expiry to 7 days from now
                
                // Ensure CreatedBy field is set (required by BaseEntity)
                if (string.IsNullOrEmpty(user.CreatedBy))
                {
                    user.CreatedBy = dto.CreatedBy ?? "system"; // Use CreatedBy if available, otherwise use 'system'
                }
                
                // Set UpdatedBy to avoid NULL constraint violation
                user.UpdatedBy = dto.CreatedBy ?? "system"; // Use CreatedBy if available, otherwise use 'system'

                _dbSet.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User created successfully: {Id}", user.Id);

                return await GetByIdAsync(user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user: {Email}", dto.Email);
                throw;
            }
        }

        public override async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto)
        {
            try
            {
                _logger.LogInformation("Updating user: {Id} with data: {@UserData}", id, dto);

                var user = await _dbSet
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

                if (user == null)
                {
                    _logger.LogWarning("User not found during update: {Id}", id);
                    throw new ApiException("User not found", 404, "USER_NOT_FOUND");
                }

                // Get the original values for logging
                var originalRole = user.Role;
                var originalEmail = user.Email;
                var originalName = $"{user.FirstName} {user.LastName}";

                try
                {
                    // Handle Role conversion explicitly to catch potential enum parsing issues
                    if (!string.IsNullOrEmpty(dto.Role))
                    {
                        _logger.LogInformation("Attempting to parse role: {Role}", dto.Role);
                        if (Enum.TryParse<UserRole>(dto.Role, out var role))
                        {
                            user.Role = role;
                            _logger.LogInformation("Successfully parsed role to: {ParsedRole}", role);
                        }
                        else
                        {
                            var validRoles = string.Join(", ", Enum.GetNames(typeof(UserRole)));
                            _logger.LogWarning("Invalid role value: {Role}. Valid roles are: {ValidRoles}", dto.Role, validRoles);
                            throw new ApiException($"Invalid role. Valid roles are: {validRoles}", 400, "INVALID_ROLE");
                        }
                    }

                    // Map the rest of the properties
                    user.Username = dto.Username;
                    user.Email = dto.Email;
                    user.FirstName = dto.FirstName;
                    user.LastName = dto.LastName;
                    user.Phone = dto.Phone;
                    user.IsActive = dto.IsActive;
                    user.UpdatedAt = DateTime.UtcNow;
                    user.UpdatedBy = dto.UpdatedBy;

                    await _context.SaveChangesAsync();

                    _logger.LogInformation("User updated successfully: {Id}. Role changed from {OldRole} to {NewRole}", 
                        id, originalRole, user.Role);

                    return _mapper.Map<UserDto>(user);
                }
                catch (ApiException)
                {
                    // Re-throw ApiExceptions as they are already formatted for the client
                    throw;
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogError(dbEx, "Database error updating user: {Id}", id);
                    throw new ApiException("Database error while updating user", 500, "DB_UPDATE_ERROR");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error updating user properties: {Id}", id);
                    throw new ApiException("Error updating user properties", 500, "USER_UPDATE_ERROR");
                }
            }
            catch (ApiException)
            {
                // Re-throw ApiExceptions so they maintain their status code and message
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user: {Id}", id);
                throw new ApiException("Failed to update user", 500, "USER_UPDATE_FAILED");
            }
        }

        public async Task<bool> ValidateCredentialsAsync(string email, string password)
        {
            try
            {
                _logger.LogInformation("Validating credentials for user: {Email}", email);

                var user = await _dbSet
                    .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);

                if (user == null)
                {
                    _logger.LogWarning("Credential validation failed: User not found - {Email}", email);
                    return false;
                }

                var isValid = BC.Verify(password, user.PasswordHash);
                _logger.LogInformation("Credential validation result for user {Email}: {IsValid}", email, isValid);

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating credentials for user: {Email}", email);
                throw;
            }
        }

        public async Task<UserDto> GetUserByIdAsync(int id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<UserDto> GetUserByUsernameAsync(string username)
        {
            var user = await _dbSet
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Username == username && !u.IsDeleted);

            if (user == null)
                return null;

            return _mapper.Map<UserDto>(user);
        }

        public async Task<IEnumerable<UserDto>> GetUsersByCompanyIdAsync(int companyId)
        {
            return await GetByCompanyIdAsync(companyId);
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto dto)
        {
            return await CreateAsync(dto);
        }

        public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto dto)
        {
            return await UpdateAsync(id, dto);
        }

        public async Task DeleteUserAsync(int id)
        {
            await DeleteAsync(id);
        }

        public async Task<bool> ChangePasswordAsync(int id, ChangePasswordDto dto)
        {
            var user = await _dbSet.FindAsync(id);
            if (user == null || user.IsDeleted)
                throw new ApiException("User not found", 404, "USER_NOT_FOUND");

            if (!BC.Verify(dto.CurrentPassword, user.PasswordHash))
                throw new ApiException("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");

            user.PasswordHash = BC.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _dbSet.Update(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdatePasswordAsync(int id, string currentPassword, string newPassword)
        {
            var user = await _dbSet.FindAsync(id);
            if (user == null || user.IsDeleted)
                throw new ApiException("User not found", 404, "USER_NOT_FOUND");

            if (!BC.Verify(currentPassword, user.PasswordHash))
                throw new ApiException("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");

            user.PasswordHash = BC.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _dbSet.Update(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<UserDto> UpdateUserStatusAsync(int id, UpdateUserStatusDto dto, string currentUserRole)
        {
            try
            {
                _logger.LogInformation("Updating user status: {Id}", id);

                var user = await _dbSet
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

                if (user == null)
                {
                    _logger.LogWarning("User not found for status update: {Id}", id);
                    throw new ApiException("User not found", 404, "USER_NOT_FOUND");
                }

                user.IsActive = dto.IsActive;
                user.UpdatedAt = DateTime.UtcNow;
                user.UpdatedBy = dto.UpdatedBy;

                await _context.SaveChangesAsync();

                _logger.LogInformation("User status updated successfully: {Id}", id);

                return _mapper.Map<UserDto>(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status: {Id}", id);
                throw;
            }
        }

        public async Task<UserDto> UpdateRoleAsync(int id, string role)
        {
            try
            {
                _logger.LogInformation($"Updating role for user: {id} to {role}");

                var user = await _dbSet
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

                if (user == null)
                {
                    throw new ApiException("User not found", 404, "USER_NOT_FOUND");
                }

                var currentRole = user.Role.ToString();
                
                try
                {
                    if (string.IsNullOrEmpty(role))
                    {
                        throw new ApiException("Role cannot be empty", 400, "INVALID_ROLE");
                    }

                    // Role is a string, attempt to parse it to our UserRole enum
                    if (Enum.TryParse<UserRole>(role, out var userRole))
                    {
                        user.Role = userRole;
                        user.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        var validRoles = string.Join(", ", Enum.GetNames(typeof(UserRole)));
                        throw new ApiException($"Invalid role. Valid roles are: {validRoles}", 400, "INVALID_ROLE");
                    }

                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"User {id} role updated from {currentRole} to {role}");
                    
                    return _mapper.Map<UserDto>(user);
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogError(dbEx, $"Database error updating role for user: {id}");
                    throw new ApiException("Database error while updating user role", 500, "DB_UPDATE_ERROR");
                }
            }
            catch (ApiException)
            {
                // Rethrow ApiException so it maintains its status code and message
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating role for user: {id}");
                throw new ApiException("Failed to update user role", 500, "ROLE_UPDATE_FAILED");
            }
        }
    }
} 