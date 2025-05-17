using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TrackMate.API.Models.DTOs
{
    public class OrdersAnalysisRequest
    {
        [JsonPropertyName("orders")]
        public List<object> Orders { get; set; }
    }
} 