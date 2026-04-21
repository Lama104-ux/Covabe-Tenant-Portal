namespace CovabeTenantPortal.Core.Models;

public class Building : BaseEntity
{
    public required string Name { get; set; }
    public required string Street { get; set; }
    public required string PostalCode { get; set; }
    public required string City { get; set; }

    public required Guid PropertyId { get; set; }
    public Property? Property { get; set; }

    public ICollection<Floor> Floors { get; set; } = [];
    public ICollection<Unit> Units { get; set; } = [];
}
