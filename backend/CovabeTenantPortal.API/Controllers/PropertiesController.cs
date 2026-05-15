using System.Security.Claims;
using CovabeTenantPortal.Core.DTOs;
using CovabeTenantPortal.Core.Interfaces;
using CovabeTenantPortal.Core.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CovabeTenantPortal.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PropertiesController(ICovabeApiClient covabeApiClient) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CovabeProperty>>> List(CancellationToken cancellationToken)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var email = User.FindFirst("email")?.Value;

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        if (role != nameof(Role.Admin))
            return Forbid();

        var properties = await covabeApiClient.GetPropertiesByOwnerEmailAsync(email, cancellationToken);
        return Ok(properties);
    }

    [HttpGet("{id:guid}/buildings")]
    public async Task<ActionResult<IEnumerable<CovabeBuilding>>> Buildings(Guid id, CancellationToken cancellationToken)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var email = User.FindFirst("email")?.Value;

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        if (role != nameof(Role.Admin))
            return Forbid();

        var buildings = await covabeApiClient.GetBuildingsForPropertyAsync(email, id, cancellationToken);
        return Ok(buildings);
    }
}
