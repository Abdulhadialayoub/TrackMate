using System.Collections.Generic;

namespace TrackMate.API.Models.DTOs
{
    public class ResponseDto<T>
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = string.Empty;
        public string ErrorCode { get; set; } = string.Empty;
        public T Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        
        public static ResponseDto<T> ErrorResponse(string message, List<string> errors = null)
        {
            return new ResponseDto<T>
            {
                Success = false,
                Message = message,
                Errors = errors ?? new List<string>()
            };
        }
    }
} 