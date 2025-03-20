using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Crypto.Generators;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

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
                Password = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
                Fullname = createUserDto.Fullname,
                Role = createUserDto.Role,
                CompanyId = createUserDto.CompanyId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Fullname = user.Fullname,
                Role = user.Role,
                CompanyId = user.CompanyId,
                CreatedDate = user.CreatedDate
            };
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
                Fullname = user.Fullname,
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
                Fullname = u.Fullname,
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
            user.Fullname = updateUserDto.Fullname;
            user.Role = updateUserDto.Role;
            user.CompanyId = updateUserDto.CompanyId;

            if (!string.IsNullOrEmpty(updateUserDto.Password))
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(updateUserDto.Password);
            }

            await _context.SaveChangesAsync();

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Fullname = user.Fullname,
                Role = user.Role,
                CompanyId = user.CompanyId,
                CreatedDate = user.CreatedDate
            };
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 