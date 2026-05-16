namespace CovabeTenantPortal.Core.Models;

public class UnitAssignment : BaseEntity
{
    public required Guid UnitId { get; set; }
    public required Guid PropertyId { get; set; }
    public Guid? BuildingId { get; set; }
    public Guid? FloorId { get; set; }

    public required string TenantFirstName { get; set; }
    public required string TenantLastName { get; set; }
    public required string TenantEmail { get; set; }
    public string? TenantPhone { get; set; }

    public required Guid AssignedById { get; set; }
    public User? AssignedBy { get; set; }

    public Guid? InvitationId { get; set; }
    public Invitation? Invitation { get; set; }
}
