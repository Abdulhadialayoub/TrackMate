using System;

namespace TrackMate.API.Exceptions
{
    public class ApiException : Exception
    {
        public int StatusCode { get; }
        public string Code { get; }

        public ApiException(string message, int statusCode = 500, string code = "INTERNAL_SERVER_ERROR")
            : base(message)
        {
            StatusCode = statusCode;
            Code = code;
        }

        public ApiException(string message, Exception innerException, int statusCode = 500, string code = "INTERNAL_SERVER_ERROR")
            : base(message, innerException)
        {
            StatusCode = statusCode;
            Code = code;
        }
    }
} 