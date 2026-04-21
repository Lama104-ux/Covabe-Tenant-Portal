namespace CovabeTenantPortal.Core.Models;

public class Floor : BaseEntity
{
    public required int FloorNumber { get; set; }
    public string? Name { get; set; }

    public required Guid BuildingId { get; set; }
    public Building? Building { get; set; }

    public ICollection<Unit> Units { get; set; } = [];
}
