using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseController : ControllerBase
    {
        protected int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        protected string GetCurrentUserEmail()
        {
            var emailClaim = User.FindFirst(ClaimTypes.Email);
            return emailClaim?.Value ?? string.Empty;
        }

        protected string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            return roleClaim?.Value ?? string.Empty;
        }

        protected int GetCurrentUserCompanyId()
        {
            var companyIdClaim = User.FindFirst("CompanyId");
            return companyIdClaim != null ? int.Parse(companyIdClaim.Value) : 0;
        }

        protected bool IsAuthorizedForCompany(int companyId)
        {
            var userRole = GetCurrentUserRole();
            var userCompanyId = GetCurrentUserCompanyId();

            // Dev rolü tüm şirketlere erişebilir
            if (userRole == "Dev")
                return true;

            // Diğer roller sadece kendi şirketlerine erişebilir
            return userCompanyId == companyId;
        }
    }
} 