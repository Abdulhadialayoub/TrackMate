using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Interfaces;

namespace TrackMate.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : BaseController
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto createOrderDto)
        {
            var order = await _orderService.CreateOrderAsync(createOrderDto);
            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetOrder(int id)
        {
            var order = await _orderService.GetOrderAsync(id);
            if (order == null)
                return NotFound();

            if (!IsAuthorizedForCompany(order.CompanyId))
                return Forbid();

            return Ok(order);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
        {
            var orders = await _orderService.GetOrdersAsync();
            var authorizedOrders = orders.Where(o => IsAuthorizedForCompany(o.CompanyId));
            return Ok(authorizedOrders);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult<OrderDto>> UpdateOrder(int id, UpdateOrderDto updateOrderDto)
        {
            var order = await _orderService.GetOrderAsync(id);
            if (order == null)
                return NotFound();

            if (!IsAuthorizedForCompany(order.CompanyId))
                return Forbid();

            var updatedOrder = await _orderService.UpdateOrderAsync(id, updateOrderDto);
            if (updatedOrder == null)
                return NotFound();

            return Ok(updatedOrder);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Dev")]
        public async Task<ActionResult> DeleteOrder(int id)
        {
            var order = await _orderService.GetOrderAsync(id);
            if (order == null)
                return NotFound();

            if (!IsAuthorizedForCompany(order.CompanyId))
                return Forbid();

            var result = await _orderService.DeleteOrderAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }
    }
} 