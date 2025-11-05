using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShopWave.Models;
using ShopWave.DTOs.Admin;

namespace ShopWave.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/vouchers")]
    [Authorize(Roles = "Admin")]
    public class VouchersAdminController : ControllerBase
    {
        private readonly ShopWaveDbContext _context;

        public VouchersAdminController(ShopWaveDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetVouchers()
        {
            var vouchers = await _context.Discounts
                .Select(v => new VoucherDto
                {
                    Id = v.Id,
                    Code = v.Code,
                    Description = v.Description,
                    DiscountValue = v.DiscountValue,
                    MinOrderAmount = v.MinOrderAmount,
                    StartDate = v.StartDate,
                    EndDate = v.EndDate,
                    IsActive = v.IsActive,
                    UsageLimit = v.UsageLimit,
                    UsageCount = v.UsageCount
                })
                .ToListAsync();

            return Ok(vouchers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetVoucherById(Guid id)
        {
            var v = await _context.Discounts.FindAsync(id);
            if (v == null)
                return NotFound();

            var dto = new VoucherDto
            {
                Id = v.Id,
                Code = v.Code,
                Description = v.Description,
                DiscountValue = v.DiscountValue,
                MinOrderAmount = v.MinOrderAmount,
                StartDate = v.StartDate,
                EndDate = v.EndDate,
                IsActive = v.IsActive,
                UsageLimit = v.UsageLimit,
                UsageCount = v.UsageCount
            };
            return Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateVoucher([FromBody] CreateVoucherDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existing = await _context.Discounts.FirstOrDefaultAsync(d => d.Code == dto.Code.ToUpper());
            if (existing != null) return Conflict(new { message = "CODE_EXISTS" });

            var voucher = new Discount
            {
                Id = Guid.NewGuid(),
                Code = dto.Code.ToUpper(),
                Description = dto.Description,
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MinOrderAmount = dto.MinOrderAmount,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                UsageLimit = dto.UsageLimit,
                IsActive = dto.IsActive,
                UsageCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Discounts.Add(voucher);
            await _context.SaveChangesAsync();

            var res = new VoucherDto { Id = voucher.Id, Code = voucher.Code, Description = voucher.Description, DiscountValue = voucher.DiscountValue, MinOrderAmount = voucher.MinOrderAmount, StartDate = voucher.StartDate, EndDate = voucher.EndDate, IsActive = voucher.IsActive, UsageLimit = voucher.UsageLimit, UsageCount = voucher.UsageCount };
            return CreatedAtAction(nameof(GetVoucherById), new { id = voucher.Id }, res);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVoucher(Guid id, [FromBody] CreateVoucherDto dto)
        {
            var v = await _context.Discounts.FindAsync(id);
            if (v == null) return NotFound();

            v.Code = dto.Code.ToUpper();
            v.Description = dto.Description;
            v.DiscountType = dto.DiscountType;
            v.DiscountValue = dto.DiscountValue;
            v.MinOrderAmount = dto.MinOrderAmount;
            v.StartDate = dto.StartDate;
            v.EndDate = dto.EndDate;
            v.UsageLimit = dto.UsageLimit;
            v.IsActive = dto.IsActive;
            v.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVoucher(Guid id)
        {
            var v = await _context.Discounts.FindAsync(id);
            if (v == null) return NotFound();
            _context.Discounts.Remove(v);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
