namespace CovabeTenantPortal.Core.DTOs;

public record CovabeBuilding(
    Guid Id,
    Guid PropertyId,
    string? Name,
    string? CustomId,
    int Status,
    int? FloorCount,
    int? UnitCount,
    List<CovabeFloor> Floors,
    List<CovabeUnit> DirectUnits);
