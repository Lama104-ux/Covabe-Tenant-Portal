using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.Models;

public class Invitation : BaseEntity
{
    public required string Email { get; set; }
    public required InvitationRole Role { get; set; }
    public required string TokenHash { get; set; }

    public required Guid InvitedById { get; set; }
    public User? InvitedBy { get; set; }

    public required DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
}
