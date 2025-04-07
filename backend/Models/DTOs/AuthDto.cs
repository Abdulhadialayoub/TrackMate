using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using TrackMate.API.Models.Enums;

namespace TrackMate.API.Models.DTOs
{
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
        public UserDto User { get; set; }
        public List<string> Permissions { get; set; } = new List<string>();
    }

    public class LoginDto
    {
        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; }
    }

    public class RegisterDto
    {
        [Required]
        [StringLength(100)]
        public string CompanyName { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(50)]
        public string LastName { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; }
    }

    public class RefreshTokenDto
    {
        [Required]
        public string RefreshToken { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public int Id { get; set; }
        public bool IsActive { get; set; }
        public string UpdatedBy { get; set; }
    }

    public class RolePermissionDto
    {
        public UserRole Role { get; set; }
        public List<string> Permissions { get; set; } = new List<string>();
    }
} 