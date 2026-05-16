using System.Security.Claims;
using CovabeTenantPortal.Core.DTOs;
using CovabeTenantPortal.Core.Interfaces;
using CovabeTenantPortal.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
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

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
            return BadRequest(new { message = "Båda lösenordsfälten krävs." });

        if (request.NewPassword.Length < 8)
            return BadRequest(new { message = "Det nya lösenordet måste vara minst 8 tecken." });

        var email = User.FindFirst("email")?.Value;
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
        if (user is null || user.PasswordHash is null)
            return Unauthorized(new { message = "Sessionen är ogiltig. Logga in igen." });

        if (!passwordHasher.Verify(user.PasswordHash, request.CurrentPassword))
            return BadRequest(new { message = "Nuvarande lösenord är fel." });

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        await context.SaveChangesAsync();

        return Ok(new { message = "Lösenord uppdaterat." });
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateMe([FromBody] UpdateMeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest(new { message = "Förnamn och efternamn krävs." });

        var email = User.FindFirst("email")?.Value;
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
        if (user is null) return Unauthorized(new { message = "Sessionen är ogiltig. Logga in igen." });

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        await context.SaveChangesAsync();

        return Ok(new UserDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role));
    }
}
