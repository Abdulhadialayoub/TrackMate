using System.Text;

namespace TrackMate.API.Configurations
{
    public class JwtConfig
    {
        public string Secret { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpirationInMinutes { get; set; }
        public byte[] SecretKey => Encoding.ASCII.GetBytes(Secret);
    }
} 