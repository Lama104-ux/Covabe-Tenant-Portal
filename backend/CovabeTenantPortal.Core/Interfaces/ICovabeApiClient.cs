using CovabeTenantPortal.Core.DTOs;

namespace CovabeTenantPortal.Core.Interfaces;

public interface ICovabeApiClient
{
    Task<List<CovabeProperty>> GetPropertiesByOwnerEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<PropertyStructure> GetPropertyStructureAsync(
        string ownerEmail,
        Guid propertyId,
        IReadOnlyDictionary<Guid, UnitOccupant>? occupants = null,
        CancellationToken cancellationToken = default);

    Task<UnitLookupResult?> FindUnitInPropertyAsync(
        string ownerEmail,
        Guid propertyId,
        Guid unitId,
        CancellationToken cancellationToken = default);
}

public record UnitOccupant(string FirstName, string LastName, string Email, string? Phone);

public record UnitLookupResult(Guid UnitId, Guid PropertyId, Guid? BuildingId, Guid? FloorId);
