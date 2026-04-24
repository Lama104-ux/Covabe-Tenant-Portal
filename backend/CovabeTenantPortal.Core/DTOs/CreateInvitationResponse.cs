using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.DTOs;

public record CreateInvitationResponse(
    Guid Id,
    string Email,
    InvitationRole Role,
    DateTimeOffset ExpiresAt);
