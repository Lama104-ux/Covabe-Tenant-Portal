using CovabeTenantPortal.Core.DTOs;
using CovabeTenantPortal.Core.Interfaces;
using CovabeTenantPortal.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CovabeTenantPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext context,
    IPasswordHasherService passwordHasher,
    IJwtService jwtService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

        if (user is null || user.PasswordHash is null)
            return Unauthorized(new { message = "Felaktig e-post eller lösenord" });

        if (!passwordHasher.Verify(user.PasswordHash, request.Password))
            return Unauthorized(new { message = "Felaktig e-post eller lösenord" });

        var (token, expiresAt) = jwtService.GenerateToken(user);

        var userDto = new UserDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role);
        return Ok(new LoginResponse(token, expiresAt, userDto));
    }
}
