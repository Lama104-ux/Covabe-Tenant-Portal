using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.Models;

public class Unit : BaseEntity
{
    public required string Name { get; set; }
    public required UnitType Type { get; set; }
    public decimal? Area { get; set; }
    public string? Description { get; set; }

    public required Guid PropertyId { get; set; }
    public Property? Property { get; set; }

    public Guid? BuildingId { get; set; }
    public Building? Building { get; set; }

    public Guid? FloorId { get; set; }
    public Floor? Floor { get; set; }

    public string? Street { get; set; }
    public string? PostalCode { get; set; }
    public string? City { get; set; }

    public ICollection<Contract> Contracts { get; set; } = [];
    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = [];
}
