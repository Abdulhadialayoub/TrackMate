using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using TrackMate.API.Exceptions;
using System.Linq;

namespace TrackMate.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseController : ControllerBase
    {
        protected int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                throw new ApiException("Unauthorized access", 401, "UNAUTHORIZED");

            return int.Parse(userIdClaim.Value);
        }

        protected int GetCompanyId()
        {
            var companyIdClaim = User.FindFirst("CompanyId");
            if (companyIdClaim == null)
                throw new ApiException("Company not found in token", 401, "COMPANY_NOT_FOUND");

            return int.Parse(companyIdClaim.Value);
        }

        protected string GetUserRole()
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            return userRole ?? string.Empty;
        }

        protected string GetUserEmail()
        {
            var emailClaim = User.FindFirst(ClaimTypes.Email);
            if (emailClaim == null)
                throw new ApiException("Email not found in token", 401, "EMAIL_NOT_FOUND");

            return emailClaim.Value;
        }

        protected bool HasPermission(string permission)
        {
            var permissionClaims = User.FindAll("permission");
            if (permissionClaims == null || !permissionClaims.Any())
                return false;

            // Check if the user has the required permission
            return permissionClaims.Any(c => c.Value == permission);
        }

        protected void RequirePermission(string permission)
        {
            if (!HasPermission(permission))
                throw new ApiException("You don't have permission to perform this action", 403, "PERMISSION_DENIED");
        }

        protected async Task<bool> ValidateCompanyAccess(int companyId)
        {
            var userCompanyId = GetCompanyId();
            var userRole = GetUserRole();

            // Only Dev role can access all companies
            if (userRole == "Dev")
                return true;

            // All other roles (including Admin) can only access their own company
            return userCompanyId == companyId;
        }

        protected ActionResult HandleException(Exception ex)
        {
            return ex switch
            {
                ApiException apiEx => StatusCode(apiEx.StatusCode, new { message = apiEx.Message, code = apiEx.Code }),
                UnauthorizedAccessException => Unauthorized(new { message = "Unauthorized access", code = "UNAUTHORIZED" }),
                _ => StatusCode(500, new { message = "An unexpected error occurred", code = "INTERNAL_SERVER_ERROR" })
            };
        }

        protected async Task<ActionResult> ExecuteAsync<T>(Func<Task<T>> action, string? entityName = null)
        {
            try
            {
                var result = await action();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        protected async Task<ActionResult> ExecuteWithValidationAsync<T>(int companyId, Func<Task<T>> action)
        {
            try
            {
                if (!await ValidateCompanyAccess(companyId))
                    return Forbid();

                var result = await action();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        protected async Task<ActionResult> ExecuteCreateAsync<T>(Func<Task<T>> action, string routeName, object routeValues)
        {
            try
            {
                var result = await action();
                return CreatedAtAction(routeName, routeValues, result);
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        protected async Task<ActionResult> ExecuteDeleteAsync(Func<Task> action)
        {
            try
            {
                await action();
                return NoContent();
            }
            catch (Exception ex)
            {
                return HandleException(ex);
            }
        }

        protected string GetCurrentUsername()
        {
            var username = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
            return username ?? "System";
        }
    }
} 