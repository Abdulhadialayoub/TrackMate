using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginDto loginDto);
        Task<RegisterResponseDto> RegisterAsync(RegisterDto registerDto);
        Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
        Task<bool> RevokeTokenAsync(string refreshToken);
    }
} 