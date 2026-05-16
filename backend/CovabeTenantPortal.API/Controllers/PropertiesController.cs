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
[Authorize]
[Route("api/[controller]")]
public class PropertiesController(
    ICovabeApiClient covabeApiClient,
    AppDbContext db,
    IInvitationTokenService tokenService,
    IEmailService emailService,
    IOptions<InvitationSettings> invitationSettings,
    IHostEnvironment environment) : ControllerBase
{
    private readonly InvitationSettings _invitationSettings = invitationSettings.Value;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CovabeProperty>>> List(CancellationToken cancellationToken)
    {
        if (!TryGetAdminEmail(out var email, out var forbid)) return forbid!;

        var properties = await covabeApiClient.GetPropertiesByOwnerEmailAsync(email!, cancellationToken);
        return Ok(properties);
    }

    [HttpGet("{id:guid}/buildings")]
    public async Task<ActionResult<IEnumerable<CovabeBuilding>>> Buildings(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetAdminEmail(out var email, out var forbid)) return forbid!;

        var assignments = await db.UnitAssignments
            .Where(a => a.PropertyId == id)
            .ToListAsync(cancellationToken);

        var occupants = assignments.ToDictionary(
            a => a.UnitId,
            a => new UnitOccupant(a.TenantFirstName, a.TenantLastName, a.TenantEmail, a.TenantPhone));

        var buildings = await covabeApiClient.GetBuildingsForPropertyAsync(email!, id, occupants, cancellationToken);
        return Ok(buildings);
    }

    [HttpGet("{id:guid}/units/{unitId:guid}")]
    public async Task<ActionResult<UnitDetailResponse>> UnitDetail(Guid id, Guid unitId, CancellationToken cancellationToken)
    {
        if (!TryGetAdminEmail(out var email, out var forbid)) return forbid!;

        var lookup = await covabeApiClient.FindUnitInPropertyAsync(email!, id, unitId, cancellationToken);
        if (lookup is null) return NotFound();

        var assignment = await db.UnitAssignments
            .Include(a => a.Invitation)
            .FirstOrDefaultAsync(a => a.UnitId == unitId, cancellationToken);

        return Ok(BuildResponse(lookup, assignment));
    }

    [HttpPost("{id:guid}/units/{unitId:guid}/assign")]
    public async Task<ActionResult<UnitDetailResponse>> AssignUnit(
        Guid id, Guid unitId, [FromBody] AssignUnitRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetAdminEmail(out var email, out var forbid)) return forbid!;

        var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (admin is null) return Unauthorized(new { message = "Sessionen är ogiltig. Logga in igen." });

        if (string.IsNullOrWhiteSpace(request.TenantFirstName)
            || string.IsNullOrWhiteSpace(request.TenantLastName)
            || string.IsNullOrWhiteSpace(request.TenantEmail))
            return BadRequest(new { message = "Förnamn, efternamn och e-post krävs." });

        var tenantEmail = request.TenantEmail.Trim();
        var tenantFirstName = request.TenantFirstName.Trim();
        var tenantLastName = request.TenantLastName.Trim();
        var tenantPhone = string.IsNullOrWhiteSpace(request.TenantPhone) ? null : request.TenantPhone.Trim();

        var lookup = await covabeApiClient.FindUnitInPropertyAsync(email!, id, unitId, cancellationToken);
        if (lookup is null) return NotFound(new { message = "Lägenheten hittades inte i denna fastighet." });

        var existing = await db.UnitAssignments.FirstOrDefaultAsync(a => a.UnitId == unitId, cancellationToken);
        if (existing is not null)
            return Conflict(new { message = "Lägenheten är redan tilldelad en hyresgäst." });

        if (await db.Users.AnyAsync(u => u.Email == tenantEmail, cancellationToken))
            return Conflict(new { message = "En användare med denna e-post finns redan. Be hyresgästen logga in istället." });

        var rawToken = tokenService.GenerateToken();
        var invitation = new Invitation
        {
            Email = tenantEmail,
            Role = InvitationRole.Tenant,
            TokenHash = tokenService.Hash(rawToken),
            InvitedById = admin.Id,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(_invitationSettings.ExpiryHours),
        };

        var assignment = new UnitAssignment
        {
            UnitId = unitId,
            PropertyId = lookup.PropertyId,
            BuildingId = lookup.BuildingId,
            FloorId = lookup.FloorId,
            TenantFirstName = tenantFirstName,
            TenantLastName = tenantLastName,
            TenantEmail = tenantEmail,
            TenantPhone = tenantPhone,
            AssignedById = admin.Id,
            Invitation = invitation,
        };

        db.Invitations.Add(invitation);
        db.UnitAssignments.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);

        var acceptUrl = $"{_invitationSettings.AcceptUrlBase}?token={rawToken}";
        await emailService.SendInvitationAsync(tenantEmail, acceptUrl, InvitationRole.Tenant);

        return Ok(BuildResponse(lookup, assignment, environment.IsDevelopment() ? acceptUrl : null));
    }

    [HttpDelete("{id:guid}/units/{unitId:guid}/assignment")]
    public async Task<IActionResult> RemoveAssignment(Guid id, Guid unitId, CancellationToken cancellationToken)
    {
        if (!TryGetAdminEmail(out var email, out var forbid)) return forbid!;

        var lookup = await covabeApiClient.FindUnitInPropertyAsync(email!, id, unitId, cancellationToken);
        if (lookup is null) return NotFound();

        var existing = await db.UnitAssignments
            .Include(a => a.Invitation)
            .FirstOrDefaultAsync(a => a.UnitId == unitId, cancellationToken);

        if (existing is null) return NoContent();

        if (existing.Invitation is { UsedAt: null } invitation)
            db.Invitations.Remove(invitation);

        db.UnitAssignments.Remove(existing);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private UnitDetailResponse BuildResponse(UnitLookupResult lookup, UnitAssignment? assignment, string? acceptUrl = null)
    {
        return new UnitDetailResponse(
            UnitId: lookup.UnitId,
            PropertyId: lookup.PropertyId,
            BuildingId: lookup.BuildingId,
            FloorId: lookup.FloorId,
            OccupantFirstName: assignment?.TenantFirstName,
            OccupantLastName: assignment?.TenantLastName,
            OccupantEmail: assignment?.TenantEmail,
            OccupantPhone: assignment?.TenantPhone,
            AssignedAt: assignment?.CreatedAt,
            InvitationStatus: assignment is null
                ? null
                : assignment.Invitation?.UsedAt is not null
                    ? "accepted"
                    : assignment.Invitation?.ExpiresAt < DateTimeOffset.UtcNow
                        ? "expired"
                        : "pending",
            AcceptUrl: acceptUrl);
    }

    private bool TryGetAdminEmail(out string? email, out ActionResult? forbid)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        email = User.FindFirst("email")?.Value;
        forbid = null;

        if (string.IsNullOrWhiteSpace(email))
        {
            forbid = Unauthorized();
            return false;
        }
        if (role != nameof(Role.Admin))
        {
            forbid = Forbid();
            return false;
        }
        return true;
    }
}

public record UnitDetailResponse(
    Guid UnitId,
    Guid PropertyId,
    Guid? BuildingId,
    Guid? FloorId,
    string? OccupantFirstName,
    string? OccupantLastName,
    string? OccupantEmail,
    string? OccupantPhone,
    DateTimeOffset? AssignedAt,
    string? InvitationStatus,
    string? AcceptUrl);
