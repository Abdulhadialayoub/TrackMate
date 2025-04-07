using System.ComponentModel.DataAnnotations;

namespace TrackMate.API.Models.DTOs
{
    public class SmtpSettingsDto
    {
        [Required]
        [StringLength(100)]
        public string Host { get; set; }

        [Required]
        [Range(1, 65535)]
        public int Port { get; set; }

        public bool EnableSsl { get; set; }

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Username { get; set; }

        [Required]
        [StringLength(100)]
        public string Password { get; set; }

        [Required]
        [StringLength(100)]
        public string From { get; set; }
    }

    public class TestEmailDto
    {
        [Required]
        [EmailAddress]
        public string Recipient { get; set; }
    }
} 