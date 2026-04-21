namespace CovabeTenantPortal.Core.Models;

public class MaintenanceRequest : BaseEntity
{
    public required Guid TenantId { get; set; }
    public User? Tenant { get; set; }

    public required Guid UnitId { get; set; }
    public Unit? Unit { get; set; }

    public required string Title { get; set; }
    public required string Description { get; set; }

    public string? CovabeWorkOrderId { get; set; }
    public string? LastKnownStatus { get; set; }
    public DateTimeOffset? LastSyncedAt { get; set; }
}
