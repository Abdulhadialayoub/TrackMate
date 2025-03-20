namespace TrackMate.API.Models.Entities
{
    public class User : BaseEntity
    {
        public int CompanyId { get; set; }
        public string UserId { get; set; }
        public string Fullname { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Phone { get; set; }
        public string Role { get; set; }
        public string Status { get; set; }

        // Navigation Property
        public virtual Company Company { get; set; }
    }
}
