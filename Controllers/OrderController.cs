using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;
using TrackMate.API.Exceptions;
using Microsoft.Extensions.Logging;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : BaseController
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrderController> _logger;

        public OrderController(
            IOrderService orderService,
            ILogger<OrderController> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll()
        {
            return await ExecuteAsync(async () => await _orderService.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetById(int id)
        {
            return await ExecuteAsync(async () => await _orderService.GetByIdAsync(id));
        }

        [HttpGet("company/{companyId}")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetByCompanyId(int companyId)
        {
            return await ExecuteWithValidationAsync(companyId, async () => await _orderService.GetByCompanyIdAsync(companyId));
        }

        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetByCustomerId(int customerId)
        {
            var order = await _orderService.GetByIdAsync(customerId);
            if (order == null)
            {
                return NotFound(new { message = "Customer not found", code = "CUSTOMER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.GetByCustomerIdAsync(customerId)
            );
        }

        [HttpPost]
        public async Task<ActionResult<OrderDto>> Create([FromBody] CreateOrderDto createOrderDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            return await ExecuteCreateAsync(
                async () => await _orderService.CreateAsync(createOrderDto),
                nameof(GetById),
                new { id = 0 } // This will be replaced with the actual ID after creation
            );
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<OrderDto>> Update(int id, [FromBody] UpdateOrderDto updateOrderDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.UpdateAsync(id, updateOrderDto)
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.DeleteAsync(id)
            );
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<OrderDto>> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto statusDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.UpdateStatusAsync(id, statusDto.Status)
            );
        }

        [HttpPost("{id}/items")]
        public async Task<ActionResult<OrderDto>> AddOrderItem(int id, [FromBody] CreateOrderItemDto orderItemDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.AddOrderItemAsync(id, orderItemDto)
            );
        }

        [HttpDelete("{id}/items/{itemId}")]
        public async Task<ActionResult<OrderDto>> RemoveOrderItem(int id, int itemId)
        {
            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found", code = "ORDER_NOT_FOUND" });
            }

            return await ExecuteWithValidationAsync(
                order.CompanyId,
                async () => await _orderService.RemoveOrderItemAsync(id, itemId)
            );
        }
    }
} 