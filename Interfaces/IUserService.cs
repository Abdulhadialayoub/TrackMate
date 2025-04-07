using System.Collections.Generic;
using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Interfaces
{
    public interface IUserService : IBaseService<User, UserDto, CreateUserDto, UpdateUserDto>
    {
        Task<UserDto> GetUserByIdAsync(int id);
        Task<UserDto> GetUserByEmailAsync(string email);
        Task<UserDto> GetUserByUsernameAsync(string username);
        Task<IEnumerable<UserDto>> GetUsersByCompanyIdAsync(int companyId);
        Task<UserDto> CreateUserAsync(CreateUserDto dto);
        Task<UserDto> UpdateUserAsync(int id, UpdateUserDto dto);
        Task DeleteUserAsync(int id);
        Task<bool> ChangePasswordAsync(int id, ChangePasswordDto dto);
        new Task<IEnumerable<UserDto>> GetByCompanyIdAsync(int companyId);
        new Task<UserDto> UpdateStatusAsync(int id, bool isActive);
        Task<bool> UpdatePasswordAsync(int id, string currentPassword, string newPassword);
        Task<bool> ValidateCredentialsAsync(string email, string password);
        Task<UserDto> UpdateUserStatusAsync(int id, UpdateUserStatusDto dto, string currentUserRole);
        Task<UserDto> UpdateRoleAsync(int id, string role);
    }
}