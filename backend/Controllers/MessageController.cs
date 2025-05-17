using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TrackMate.API.Exceptions;
using TrackMate.API.Interfaces;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Enums;
using TrackMate.API.Data;
using System.Linq;

namespace TrackMate.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessageController : BaseController
    {
        private readonly IMessageLogService _messageLogService;
        private readonly IEmailService _emailService;
        private readonly ILogger<MessageController> _logger;
        private readonly TrackMateDbContext _context;

        public MessageController(
            IMessageLogService messageLogService,
            IEmailService emailService,
            ILogger<MessageController> logger,
            TrackMateDbContext context)
        {
            _messageLogService = messageLogService;
            _emailService = emailService;
            _logger = logger;
            _context = context;
        }

        [HttpGet("logs")]
        public async Task<ActionResult<IEnumerable<MessageLogDto>>> GetAllLogs()
        {
            try
            {
                // Get the company ID from the token
                var companyId = GetCompanyId();
                var messageLogs = await _messageLogService.GetMessageLogsByCompanyIdAsync(companyId);
                return Ok(new ResponseDto<IEnumerable<MessageLogDto>>
                {
                    Success = true,
                    Message = "Message logs retrieved successfully",
                    Data = messageLogs
                });
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new ResponseDto<IEnumerable<MessageLogDto>>
                {
                    Success = false,
                    Message = ex.Message,
                    Errors = new List<string> { ex.Code },
                    Data = new List<MessageLogDto>()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving message logs");
                return StatusCode(500, new ResponseDto<IEnumerable<MessageLogDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving message logs",
                    Errors = new List<string> { ex.Message },
                    Data = new List<MessageLogDto>()
                });
            }
        }

        [HttpGet("logs/{id}")]
        public async Task<ActionResult<MessageLogDto>> GetLogById(int id)
        {
            try
            {
                var messageLog = await _messageLogService.GetMessageLogByIdAsync(id);
                
                // Check if the user has access to the message log's company
                if (!await ValidateCompanyAccess(messageLog.CompanyId))
                {
                    return Forbid();
                }
                
                return Ok(new ResponseDto<MessageLogDto>
                {
                    Success = true,
                    Message = "Message log retrieved successfully",
                    Data = messageLog
                });
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new ResponseDto<MessageLogDto>
                {
                    Success = false,
                    Message = ex.Message,
                    Errors = new List<string> { ex.Code }
                });
            }
        }

        [HttpGet("logs/customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<MessageLogDto>>> GetLogsByCustomer(int customerId)
        {
            try
            {
                // Verify the customer belongs to the user's company
                var customer = await _context.Customers.FindAsync(customerId);
                if (customer == null)
                {
                    return NotFound(new ResponseDto<IEnumerable<MessageLogDto>>
                    {
                        Success = false,
                        Message = "Customer not found",
                        Data = new List<MessageLogDto>()
                    });
                }

                if (!await ValidateCompanyAccess(customer.CompanyId))
                {
                    return Forbid();
                }

                var messageLogs = await _messageLogService.GetMessageLogsByCustomerIdAsync(customerId);
                return Ok(new ResponseDto<IEnumerable<MessageLogDto>>
                {
                    Success = true,
                    Message = "Message logs retrieved successfully",
                    Data = messageLogs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving message logs for customer {CustomerId}", customerId);
                return StatusCode(500, new ResponseDto<IEnumerable<MessageLogDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving message logs",
                    Errors = new List<string> { ex.Message },
                    Data = new List<MessageLogDto>()
                });
            }
        }

        [HttpGet("logs/type/{messageType}")]
        public async Task<ActionResult<IEnumerable<MessageLogDto>>> GetLogsByType(MessageType messageType)
        {
            try
            {
                // Get the company ID from the token to filter messages
                var companyId = GetCompanyId();
                var messageLogs = await _messageLogService.GetMessageLogsByTypeAsync(messageType);
                
                // Filter to only show messages from the user's company
                messageLogs = messageLogs.Where(m => m.CompanyId == companyId);
                
                return Ok(new ResponseDto<IEnumerable<MessageLogDto>>
                {
                    Success = true,
                    Message = $"{messageType} logs retrieved successfully",
                    Data = messageLogs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving message logs for type {MessageType}", messageType);
                return StatusCode(500, new ResponseDto<IEnumerable<MessageLogDto>>
                {
                    Success = false,
                    Message = "An error occurred while retrieving message logs",
                    Errors = new List<string> { ex.Message },
                    Data = new List<MessageLogDto>()
                });
            }
        }

        [HttpPost("send")]
        public async Task<ActionResult<MessageLogDto>> SendMessage([FromBody] SendMessageDto request)
        {
            try
            {
                // Check if the user has access to the company
                if (!await ValidateCompanyAccess(request.CompanyId))
                {
                    return Forbid();
                }

                // Create the message log first
                var createDto = new CreateMessageLogDto
                {
                    CompanyId = request.CompanyId,
                    CustomerId = request.CustomerId,
                    Recipient = request.Recipient,
                    Subject = request.Subject,
                    Content = request.Content,
                    MessageType = request.MessageType,
                    Status = EmailStatus.Pending,
                    SentDate = DateTime.UtcNow,
                    RelatedEntityId = request.RelatedEntityId,
                    RelatedEntityType = request.RelatedEntityType,
                    SentBy = GetUserId(),
                    CreatedBy = GetCurrentUsername()
                };

                var messageLog = await _messageLogService.CreateMessageLogAsync(createDto);

                // Based on message type, process differently
                bool sendResult = false;
                switch (request.MessageType)
                {
                    case MessageType.Email:
                        // For emails, use the existing email service
                        sendResult = await _emailService.SendEmailAsync(
                            request.Recipient,
                            request.Subject,
                            request.Content,
                            request.CompanyId,
                            request.CustomerId);
                        break;
                    
                    case MessageType.SMS:
                        // SMS implementation would go here
                        _logger.LogInformation("SMS sending not yet implemented");
                        sendResult = true; // Mock success for now
                        break;
                    
                    case MessageType.InApp:
                        // In-app notification implementation would go here
                        _logger.LogInformation("In-app notification sending not yet implemented");
                        sendResult = true; // Mock success for now
                        break;
                    
                    case MessageType.WhatsApp:
                        // WhatsApp implementation would go here
                        _logger.LogInformation("WhatsApp sending not yet implemented");
                        sendResult = true; // Mock success for now
                        break;
                    
                    case MessageType.Push:
                        // Push notification implementation would go here
                        _logger.LogInformation("Push notification sending not yet implemented");
                        sendResult = true; // Mock success for now
                        break;
                    
                    default:
                        return BadRequest(new ResponseDto<MessageLogDto>
                        {
                            Success = false,
                            Message = "Unsupported message type",
                            Errors = new List<string> { "UNSUPPORTED_MESSAGE_TYPE" }
                        });
                }

                // Update message status based on send result
                var updateDto = new UpdateMessageLogDto
                {
                    Status = sendResult ? EmailStatus.Sent : EmailStatus.Failed,
                    SentAt = sendResult ? DateTime.UtcNow : null,
                    ErrorMessage = sendResult ? null : "Failed to send message",
                    UpdatedBy = GetCurrentUsername()
                };

                var updatedMessageLog = await _messageLogService.UpdateMessageLogAsync(messageLog.Id, updateDto);

                return Ok(new ResponseDto<MessageLogDto>
                {
                    Success = sendResult,
                    Message = sendResult ? "Message sent successfully" : "Failed to send message",
                    Data = updatedMessageLog
                });
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new ResponseDto<MessageLogDto>
                {
                    Success = false,
                    Message = ex.Message,
                    Errors = new List<string> { ex.Code }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message");
                return StatusCode(500, new ResponseDto<MessageLogDto>
                {
                    Success = false,
                    Message = "An error occurred while sending the message",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpDelete("logs/{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult> DeleteMessageLog(int id)
        {
            try
            {
                var messageLog = await _messageLogService.GetMessageLogByIdAsync(id);
                
                // Check if the user has access to delete the message log
                if (!await ValidateCompanyAccess(messageLog.CompanyId))
                {
                    return Forbid();
                }
                
                await _messageLogService.DeleteMessageLogAsync(id);
                
                return Ok(new ResponseDto<bool>
                {
                    Success = true,
                    Message = "Message log deleted successfully",
                    Data = true
                });
            }
            catch (ApiException ex)
            {
                return StatusCode(ex.StatusCode, new ResponseDto<bool>
                {
                    Success = false,
                    Message = ex.Message,
                    Errors = new List<string> { ex.Code },
                    Data = false
                });
            }
        }
    }
} 