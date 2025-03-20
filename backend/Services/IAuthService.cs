using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<bool> ValidateUserAsync(string email, string password);
    }
} 