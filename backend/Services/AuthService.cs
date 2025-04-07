using AutoMapper;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using TrackMate.API.Data;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;
using TrackMate.API.Models.Enums;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using TrackMate.API.Security;
using TrackMate.API.Configurations;

namespace TrackMate.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly TrackMateDbContext _context;
        private readonly JwtConfig _jwtConfig;
        private readonly IMapper _mapper;
        private readonly ILogger<AuthService> _logger;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IConfiguration _configuration;
        private readonly IUserService _userService;

        public AuthService(
            TrackMateDbContext context,
            JwtConfig jwtConfig,
            IMapper mapper,
            ILogger<AuthService> logger,
            IPasswordHasher passwordHasher,
            IConfiguration configuration,
            IUserService userService)
        {
            _context = context;
            _jwtConfig = jwtConfig;
            _mapper = mapper;
            _logger = logger;
            _passwordHasher = passwordHasher;
            _configuration = configuration;
            _userService = userService;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            try
            {
                _logger.LogInformation($"Attempting login for user: {loginDto.Email}");
                
                var user = await _context.Users
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.Email == loginDto.Email && !u.IsDeleted);

                if (user == null || !_passwordHasher.VerifyPassword(loginDto.Password, user.PasswordHash))
                {
                    _logger.LogWarning($"Login failed for user: {loginDto.Email}");
                    throw new ApiException("Invalid email or password", 401, "INVALID_CREDENTIALS");
                }

                if (!user.IsActive)
                {
                    _logger.LogWarning($"Login attempt for inactive user: {loginDto.Email}");
                    throw new ApiException("Account is inactive", 403, "ACCOUNT_INACTIVE");
                }

                // Update last login date
                user.LastLoginDate = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                _context.Users.Update(user);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"User {user.Email} logged in successfully at {user.LastLoginDate}");

                return await GenerateAuthResponseAsync(user);
            }
            catch (ApiException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during login for user: {loginDto.Email}");
                throw new ApiException("An error occurred during login", 500, "SERVER_ERROR");
            }
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
        {
            try
            {
                _logger.LogInformation($"Attempting to register new user: {registerDto.Email}");
                
                if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email && !u.IsDeleted))
                {
                    _logger.LogWarning($"Registration failed: Email already exists: {registerDto.Email}");
                    throw new ApiException("Email already exists", 400, "EMAIL_EXISTS");
                }

                try
                {
                    // Create a new company with null CompanyId
                    _logger.LogInformation($"Starting registration for: {registerDto.Email} with company {registerDto.CompanyName}");
                    
                    // Temporarily disable foreign key constraints
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE Companies NOCHECK CONSTRAINT FK_Companies_Companies_CompanyId");
                    
                    var company = new Company
                {
                    Name = registerDto.CompanyName,
                        Email = registerDto.Email,
                        Address = "To be updated",
                        Phone = "To be updated",
                        TaxId = "NA",
                        TaxNumber = "NA",
                        Website = "N/A",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = registerDto.Email,
                        UpdatedBy = registerDto.Email,
                        UpdatedAt = DateTime.UtcNow,
                        IsActive = true,
                        CompanyId = 0 // Use 0 instead of null for non-nullable int
                };

                    _logger.LogInformation($"Adding company: {company.Name} to context");
                await _context.Companies.AddAsync(company);
                await _context.SaveChangesAsync();

                    // Update the CompanyId after getting the Id
                    _logger.LogInformation($"Company created with Id: {company.Id}, now updating CompanyId");
                    await _context.Database.ExecuteSqlRawAsync(
                        $"UPDATE Companies SET CompanyId = {company.Id} WHERE Id = {company.Id}");
                    
                    // Re-enable foreign key constraints
                    await _context.Database.ExecuteSqlRawAsync("ALTER TABLE Companies CHECK CONSTRAINT FK_Companies_Companies_CompanyId");
                    
                    company.CompanyId = company.Id;
                    _logger.LogInformation($"Company CompanyId updated to: {company.CompanyId}");
                    
                    // Create user with required information
                var user = new User
                {
                        Username = registerDto.Email, // Use email as username by default
                    Email = registerDto.Email,
                    PasswordHash = _passwordHasher.HashPassword(registerDto.Password),
                    FirstName = registerDto.FirstName,
                    LastName = registerDto.LastName,
                        Phone = "NA", // Default value for phone
                    CompanyId = company.Id,
                    Role = UserRole.Admin, // First user is always admin
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = registerDto.Email,
                        UpdatedBy = registerDto.Email,
                        UpdatedAt = DateTime.UtcNow,
                        IsActive = true,
                        RefreshToken = GenerateRefreshToken(), // Generate initial refresh token
                        RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30) // Set expiry to 30 days
                    };

                    _logger.LogInformation($"Creating user: {user.Email}");
                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();
                    _logger.LogInformation($"User created with ID: {user.Id}");

                return await GenerateAuthResponseAsync(user);
                }
                catch (Exception innerEx)
                {
                    _logger.LogError(innerEx, $"Detailed error during registration: {innerEx.Message}");
                    // Stack trace'i görmek için
                    _logger.LogError($"Stack trace: {innerEx.StackTrace}");
                    // InnerException varsa onu da görmek için
                    if (innerEx.InnerException != null)
                    {
                        _logger.LogError($"Inner exception: {innerEx.InnerException.Message}");
                        _logger.LogError($"Inner exception stack trace: {innerEx.InnerException.StackTrace}");
                    }
                    throw;
                }
            }
            catch (ApiException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during registration for user: {registerDto.Email}");
                throw new ApiException("An error occurred during registration", 500, "SERVER_ERROR");
            }
        }

        public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto refreshTokenDto)
        {
            try
            {
                _logger.LogInformation("Attempting to refresh token");
                
                var refreshToken = refreshTokenDto.RefreshToken;
                var user = await _context.Users
                    .Include(u => u.Company)
                    .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && 
                                             u.RefreshTokenExpiryTime > DateTime.UtcNow && 
                                             !u.IsDeleted);

                if (user == null)
                {
                    _logger.LogWarning("Refresh token failed: Invalid or expired token");
                    throw new ApiException("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
                }

                if (!user.IsActive)
                {
                    _logger.LogWarning($"Refresh token attempt for inactive user: {user.Email}");
                    throw new ApiException("Account is inactive", 403, "ACCOUNT_INACTIVE");
                }

                return await GenerateAuthResponseAsync(user);
            }
            catch (ApiException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token refresh");
                throw new ApiException("An error occurred during token refresh", 500, "SERVER_ERROR");
            }
        }

        public async Task<bool> RevokeTokenAsync(string refreshToken)
        {
            try
            {
                _logger.LogInformation("Attempting to revoke token");
                
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

                if (user == null)
                {
                    _logger.LogWarning("Revoke token failed: Invalid token");
                    throw new ApiException("Invalid refresh token", 400, "INVALID_REFRESH_TOKEN");
                }

                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                user.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (ApiException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during token revocation");
                throw new ApiException("An error occurred during token revocation", 500, "SERVER_ERROR");
            }
        }

        public async Task LogoutAsync()
        {
            // Client-side logout only, nothing to do server-side
            await Task.CompletedTask;
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
                _logger.LogInformation("Validating token");
                
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtConfig.Secret);

                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = _jwtConfig.Issuer,
                    ValidAudience = _jwtConfig.Audience,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return validatedToken != null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Token validation failed");
                return false;
            }
        }

        public async Task<bool> ValidateUserAccessAsync(int userId, int companyId)
        {
            try
            {
                _logger.LogInformation($"Validating user access for user: {userId}, company: {companyId}");
                
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId && u.CompanyId == companyId && !u.IsDeleted);

                return user != null && user.IsActive;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating user access for user: {userId}, company: {companyId}");
                return false;
            }
        }

        public async Task<bool> ValidateUserRoleAsync(int userId, string requiredRole)
        {
            try
            {
                _logger.LogInformation($"Validating user role for user: {userId}, required role: {requiredRole}");
                
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

                if (user == null || !user.IsActive)
                    return false;

                // Parse the required role string to enum
                if (!Enum.TryParse<UserRole>(requiredRole, out var requiredRoleEnum))
                    return false;

                // Simple role check, can be extended for more complex role hierarchies
                switch (requiredRoleEnum)
                {
                    case UserRole.Admin:
                        return user.Role == UserRole.Admin || user.Role == UserRole.Dev;
                    case UserRole.Manager:
                        return user.Role == UserRole.Admin || user.Role == UserRole.Manager || user.Role == UserRole.Dev;
                    case UserRole.User:
                        return user.Role == UserRole.Admin || user.Role == UserRole.Manager || user.Role == UserRole.User || user.Role == UserRole.Dev;
                    case UserRole.Viewer:
                        return true; // Everyone can access viewer-level resources
                    default:
                        return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating user role for user: {userId}, required role: {requiredRole}");
                return false;
            }
        }

        private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtConfig.Secret);
            
                // Get user's permissions based on role
                var permissions = GetPermissionsForRole(user.Role);
                
                // Get user's claims
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
                    new Claim(ClaimTypes.Role, user.Role.ToString()),
                    new Claim("CompanyId", user.CompanyId.ToString())
                };
                
                // Add permissions as claims
                foreach (var permission in permissions)
                {
                    claims.Add(new Claim("permission", permission));
                }

                // Token süresi 60 dakikadan (bir saat) 720 dakikaya (12 saat) çıkarılmıştır
                var tokenExpiry = DateTime.UtcNow.AddMinutes(720);
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = tokenExpiry,
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                    Issuer = _jwtConfig.Issuer,
                    Audience = _jwtConfig.Audience
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);

                // Generate refresh token
                var refreshToken = GenerateRefreshToken();
            
                // Store refresh token
            user.RefreshToken = refreshToken;
                // Refresh token süresi 7 günden 30 güne çıkarılmıştır
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(30);
                user.UpdatedAt = DateTime.UtcNow;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                    Token = tokenHandler.WriteToken(token),
                RefreshToken = refreshToken,
                    ExpiresAt = tokenExpiry,
                    User = _mapper.Map<UserDto>(user),
                    Permissions = permissions
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating auth response for user: {UserId}", user.Id);
                throw new ApiException("Failed to generate authentication response", 500, "AUTH_RESPONSE_FAILED");
            }
        }

        private List<string> GetPermissionsForRole(UserRole role)
        {
            var permissions = new List<string>();
            
            switch (role)
            {
                case UserRole.Dev:
                    // Dev has all permissions
                    permissions.AddRange(new[] {
                        // System permissions
                        Permissions.SystemAccess,
                        Permissions.ConfigureSystem,
                        Permissions.ViewAllData,
                        
                        // Admin permissions
                        Permissions.ManageRoles,
                        Permissions.ViewAllCompanyData,
                        
                        // Companies
                        Permissions.ViewCompanies,
                        Permissions.CreateCompany,
                        Permissions.UpdateCompany,
                        Permissions.DeleteCompany,
                        
                        // Users
                        Permissions.ViewUsers,
                        Permissions.CreateUser,
                        Permissions.UpdateUser,
                        Permissions.DeleteUser,
                        
                        // Products
                        Permissions.ViewProducts,
                        Permissions.CreateProduct,
                        Permissions.UpdateProduct,
                        Permissions.DeleteProduct,
                        
                        // Customers
                        Permissions.ViewCustomers,
                        Permissions.CreateCustomer,
                        Permissions.UpdateCustomer,
                        Permissions.DeleteCustomer,
                        
                        // Orders
                        Permissions.ViewOrders,
                        Permissions.CreateOrder,
                        Permissions.UpdateOrder,
                        Permissions.DeleteOrder,
                        
                        // Invoices
                        Permissions.ViewInvoices,
                        Permissions.CreateInvoice,
                        Permissions.UpdateInvoice,
                        Permissions.DeleteInvoice,
                        
                        // Reports
                        Permissions.ViewReports,
                        Permissions.ExportReports
                    });
                    break;
                    
                case UserRole.Admin:
                    // Admin has company-wide permissions
                    permissions.AddRange(new[] {
                        // Admin permissions
                        Permissions.ManageRoles,
                        Permissions.ViewAllCompanyData,
                        
                        // Companies
                        Permissions.ViewCompanies,
                        Permissions.UpdateCompany,
                        
                        // Users
                        Permissions.ViewUsers,
                        Permissions.CreateUser,
                        Permissions.UpdateUser,
                        Permissions.DeleteUser,
                        
                        // Products
                        Permissions.ViewProducts,
                        Permissions.CreateProduct,
                        Permissions.UpdateProduct,
                        Permissions.DeleteProduct,
                        
                        // Customers
                        Permissions.ViewCustomers,
                        Permissions.CreateCustomer,
                        Permissions.UpdateCustomer,
                        Permissions.DeleteCustomer,
                        
                        // Orders
                        Permissions.ViewOrders,
                        Permissions.CreateOrder,
                        Permissions.UpdateOrder,
                        Permissions.DeleteOrder,
                        
                        // Invoices
                        Permissions.ViewInvoices,
                        Permissions.CreateInvoice,
                        Permissions.UpdateInvoice,
                        Permissions.DeleteInvoice,
                        
                        // Reports
                        Permissions.ViewReports,
                        Permissions.ExportReports
                    });
                    break;
                    
                case UserRole.Manager:
                    // Manager has department-wide permissions
                    permissions.AddRange(new[] {
                        // Companies
                        Permissions.ViewCompanies,
                        
                        // Users
                        Permissions.ViewUsers,
                        
                        // Products
                        Permissions.ViewProducts,
                        Permissions.CreateProduct,
                        Permissions.UpdateProduct,
                        
                        // Customers
                        Permissions.ViewCustomers,
                        Permissions.CreateCustomer,
                        Permissions.UpdateCustomer,
                        
                        // Orders
                        Permissions.ViewOrders,
                        Permissions.CreateOrder,
                        Permissions.UpdateOrder,
                        
                        // Invoices
                        Permissions.ViewInvoices,
                        Permissions.CreateInvoice,
                        Permissions.UpdateInvoice,
                        
                        // Reports
                        Permissions.ViewReports,
                        Permissions.ExportReports
                    });
                    break;
                    
                case UserRole.User:
                    // Regular user has basic operational permissions
                    permissions.AddRange(new[] {
                        // Products
                        Permissions.ViewProducts,
                        
                        // Customers
                        Permissions.ViewCustomers,
                        Permissions.CreateCustomer,
                        
                        // Orders
                        Permissions.ViewOrders,
                        Permissions.CreateOrder,
                        
                        // Invoices
                        Permissions.ViewInvoices,
                        
                        // Reports
                        Permissions.ViewReports
                    });
                    break;
                    
                case UserRole.Viewer:
                    // Viewer has read-only permissions
                    permissions.AddRange(new[] {
                        // Products
                        Permissions.ViewProducts,
                        
                        // Customers
                        Permissions.ViewCustomers,
                        
                        // Orders
                        Permissions.ViewOrders,
                        
                        // Invoices
                        Permissions.ViewInvoices,
                        
                        // Reports
                        Permissions.ViewReports
                    });
                    break;
            }
            
            return permissions;
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}