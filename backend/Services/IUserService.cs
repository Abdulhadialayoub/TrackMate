using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Services
{
    public interface IUserService
    {
        Task<UserDto> CreateUserAsync(CreateUserDto createUserDto);
        Task<UserDto?> GetUserAsync(int id);
        Task<IEnumerable<UserDto>> GetUsersAsync();
        Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateUserDto);
        Task<bool> DeleteUserAsync(int id);
    }
} 