using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IUserService
    {
        Task<UserDto> CreateUserAsync(CreateUserDto createUserDto);
        Task<UserDto?> GetUserAsync(int id);
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<IEnumerable<UserDto>> GetUsersAsync();
        Task<IEnumerable<UserDto>> GetUsersByCompanyAsync(int companyId);
        Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateUserDto);
        Task<bool> DeleteUserAsync(int id);
        Task<bool> ValidateUserCredentialsAsync(string email, string password);
    }
}