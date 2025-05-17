using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Services;
using TrackMate.API.Models.DTOs;
using System.Threading.Tasks;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : BaseController
    {
        private readonly IAIService _aiService;
        private readonly ILogger<AIController> _logger;

        public AIController(
            IAIService aiService,
            ILogger<AIController> logger)
        {
            _aiService = aiService;
            _logger = logger;
        }

        [HttpPost("analyze-order")]
        public async Task<IActionResult> AnalyzeOrder([FromBody] object orderData)
        {
            try
            {
                _logger.LogInformation("Received request to analyze order");
                
                if (orderData == null)
                {
                    return BadRequest("Order data is required");
                }

                var analysis = await _aiService.AnalyzeOrderAsync(orderData);
                
                return Ok(new { 
                    success = true, 
                    comment = analysis,
                    provider = _aiService.GetProviderName()
                });
            }
            catch (TimeoutException ex)
            {
                _logger.LogError(ex, "AI analysis request timed out");
                return StatusCode(504, new { 
                    success = false, 
                    message = "AI analysis timed out. Please try again later.", 
                    error = ex.Message 
                });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error connecting to AI service: {Message}", ex.Message);
                return StatusCode(502, new { 
                    success = false, 
                    message = "Unable to connect to AI service. Please verify the service is online.", 
                    error = ex.Message 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in analyze-order endpoint: {Message}", ex.Message);
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to analyze order", 
                    error = ex.Message 
                });
            }
        }
        
        [HttpPost("analyze-feedback")]
        public async Task<IActionResult> AnalyzeFeedback([FromBody] FeedbackAnalysisDto request)
        {
            try
            {
                _logger.LogInformation("Received request to analyze feedback: {Feedback}", request.Feedback);
                
                if (string.IsNullOrWhiteSpace(request.Feedback))
                {
                    return BadRequest("Feedback text is required");
                }

                var analysis = await _aiService.AnalyzeFeedbackAsync(request.Feedback);
                
                return Ok(new { 
                    success = true, 
                    analysis,
                    provider = _aiService.GetProviderName()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in analyze-feedback endpoint");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to analyze feedback", 
                    error = ex.Message 
                });
            }
        }

        [HttpPost("analyze-orders")]
        public async Task<IActionResult> AnalyzeOrders([FromBody] OrdersAnalysisRequest request)
        {
            try
            {
                if (request?.Orders == null || !request.Orders.Any())
                {
                    return BadRequest(new { message = "No orders provided for analysis" });
                }
                
                _logger.LogInformation($"Received bulk analysis request for {request.Orders.Count} orders");
                
                var comment = await _aiService.AnalyzeOrdersAsync(request.Orders);
                return Ok(new { 
                    comment,
                    provider = _aiService.GetProviderName()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing multiple orders");
                return StatusCode(500, new { message = "Failed to analyze orders: " + ex.Message });
            }
        }
        
        [HttpGet("provider")]
        public IActionResult GetProvider()
        {
            return Ok(new { 
                provider = _aiService.GetProviderName()
            });
        }
    }
    
    public class FeedbackAnalysisDto
    {
        public string Feedback { get; set; } = string.Empty;
    }
} 