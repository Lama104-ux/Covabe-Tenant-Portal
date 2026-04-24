using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CovabeTenantPortal.Core.DTOs;
using CovabeTenantPortal.Core.Interfaces;
using CovabeTenantPortal.Core.Models;
using CovabeTenantPortal.Core.Models.Enums;
using CovabeTenantPortal.Infrastructure.Data;
using CovabeTenantPortal.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CovabeTenantPortal.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvitationsController(
    AppDbContext context,
    IInvitationTokenService tokenService,
    IPasswordHasherService passwordHasher,
    IEmailService emailService,
    IOptions<InvitationSettings> settings) : ControllerBase
{
    private readonly InvitationSettings _settings = settings.Value;

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<CreateInvitationResponse>> Create([FromBody] CreateInvitationRequest request)
    {
        var currentRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        if (currentUserIdClaim is null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
            return Unauthorized();

        var canInviteAdmin = currentRole == nameof(Role.SuperAdmin);
        var canInviteTenant = currentRole == nameof(Role.Admin) || currentRole == nameof(Role.SuperAdmin);

        if (request.Role == InvitationRole.Admin && !canInviteAdmin)
            return Forbid();

        if (request.Role == InvitationRole.Tenant && !canInviteTenant)
            return Forbid();

        if (await context.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict(new { message = "En användare med den e-postadressen finns redan" });

        var rawToken = tokenService.GenerateToken();

        var invitation = new Invitation
        {
            Email = request.Email,
            Role = request.Role,
            TokenHash = tokenService.Hash(rawToken),
            InvitedById = currentUserId,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(_settings.ExpiryHours)
        };

        context.Invitations.Add(invitation);
        await context.SaveChangesAsync();

        var acceptUrl = $"{_settings.AcceptUrlBase}?token={rawToken}";
        await emailService.SendInvitationAsync(request.Email, acceptUrl, request.Role);

        return Ok(new CreateInvitationResponse(invitation.Id, invitation.Email, invitation.Role, invitation.ExpiresAt));
    }

    [AllowAnonymous]
    [HttpPost("accept")]
    public async Task<IActionResult> Accept([FromBody] AcceptInvitationRequest request)
    {
        var tokenHash = tokenService.Hash(request.Token);

        var invitation = await context.Invitations
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash);

        if (invitation is null)
            return BadRequest(new { message = "Ogiltigt token" });

        if (invitation.UsedAt is not null)
            return BadRequest(new { message = "Inbjudan har redan använts" });

        if (invitation.ExpiresAt < DateTimeOffset.UtcNow)
            return BadRequest(new { message = "Inbjudan har löpt ut" });

        if (await context.Users.AnyAsync(u => u.Email == invitation.Email))
            return BadRequest(new { message = "E-postadressen är redan registrerad" });

        var user = new User
        {
            Email = invitation.Email,
            PasswordHash = passwordHasher.Hash(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            Role = invitation.Role == InvitationRole.Admin ? Role.Admin : Role.Tenant,
            IsActive = true
        };

        invitation.UsedAt = DateTimeOffset.UtcNow;
        context.Users.Add(user);
        await context.SaveChangesAsync();

        return Ok(new { message = "Konto skapat. Du kan nu logga in." });
    }
}
