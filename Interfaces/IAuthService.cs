using System.Threading.Tasks;
using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Interfaces
{
    /// <summary>
    /// Service interface for handling authentication operations
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Authenticates a user and returns a JWT token
        /// </summary>
        /// <param name="loginDto">Login credentials</param>
        /// <returns>Authentication response containing token and user information</returns>
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);

        /// <summary>
        /// Registers a new user and company
        /// </summary>
        /// <param name="registerDto">Registration information</param>
        /// <returns>Authentication response containing token and user information</returns>
        Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);

        /// <summary>
        /// Refreshes an expired JWT token
        /// </summary>
        /// <param name="refreshTokenDto">Refresh token information</param>
        /// <returns>New authentication response containing refreshed token</returns>
        Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto refreshTokenDto);

        /// <summary>
        /// Revokes a refresh token
        /// </summary>
        /// <param name="refreshToken">The refresh token to revoke</param>
        /// <returns>True if token was revoked successfully</returns>
        Task<bool> RevokeTokenAsync(string refreshToken);

        /// <summary>
        /// Logs out the current user
        /// </summary>
        Task LogoutAsync();

        /// <summary>
        /// Validates a JWT token
        /// </summary>
        /// <param name="token">The token to validate</param>
        /// <returns>True if token is valid</returns>
        Task<bool> ValidateTokenAsync(string token);
    }
} 