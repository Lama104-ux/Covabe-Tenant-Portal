namespace CovabeTenantPortal.Core.Models;

public class Property : BaseEntity
{
    public required string Name { get; set; }
    public string? Description { get; set; }

    public required Guid AdminId { get; set; }
    public User? Admin { get; set; }

    public ICollection<Building> Buildings { get; set; } = [];
    public ICollection<Unit> Units { get; set; } = [];
    public ICollection<News> News { get; set; } = [];
}
