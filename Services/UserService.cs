using Microsoft.EntityFrameworkCore;
using TrackMate.API.Services;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Interfaces;
using BC = BCrypt.Net.BCrypt;

namespace TrackMate.API.Services
{
    public class UserService : IUserService
    {
        private readonly TrackMateDbContext _context;

        public UserService(TrackMateDbContext context)
        {
            _context = context;
        }

        public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
        {
            var user = new User
            {
                Email = createUserDto.Email,
                UserName = createUserDto.UserName,
                FirstName = createUserDto.FirstName,
                LastName = createUserDto.LastName,
                PasswordHash = BC.HashPassword(createUserDto.Password),
                Role = createUserDto.Role,
                CompanyId = createUserDto.CompanyId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return await GetUserAsync(user.Id);
        }

        public async Task<UserDto?> GetUserAsync(int id)
        {
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                UserName = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                CompanyId = user.CompanyId,
                CompanyName = user.Company?.Name,
                CreatedDate = user.CreatedDate
            };
        }

        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var user = await _context.Users
                .Include(u => u.Company)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return null;

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                UserName = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                CompanyId = user.CompanyId,
                CompanyName = user.Company?.Name,
                CreatedDate = user.CreatedDate
            };
        }

        public async Task<IEnumerable<UserDto>> GetUsersAsync()
        {
            var users = await _context.Users
                .Include(u => u.Company)
                .ToListAsync();

            return users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                UserName = u.UserName,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role,
                CompanyId = u.CompanyId,
                CompanyName = u.Company?.Name,
                CreatedDate = u.CreatedDate
            });
        }

        public async Task<IEnumerable<UserDto>> GetUsersByCompanyAsync(int companyId)
        {
            var users = await _context.Users
                .Include(u => u.Company)
                .Where(u => u.CompanyId == companyId)
                .ToListAsync();

            return users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                UserName = u.UserName,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role,
                CompanyId = u.CompanyId,
                CompanyName = u.Company?.Name,
                CreatedDate = u.CreatedDate
            });
        }

        public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;

            user.Email = updateUserDto.Email;
            user.UserName = updateUserDto.UserName;
            user.FirstName = updateUserDto.FirstName;
            user.LastName = updateUserDto.LastName;
            user.Role = updateUserDto.Role;
            user.CompanyId = updateUserDto.CompanyId;

            if (!string.IsNullOrEmpty(updateUserDto.Password))
            {
                user.PasswordHash = BC.HashPassword(updateUserDto.Password);
            }

            await _context.SaveChangesAsync();

            return await GetUserAsync(user.Id);
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ValidateUserCredentialsAsync(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return false;

            return BC.Verify(password, user.PasswordHash);
        }
    }
} 