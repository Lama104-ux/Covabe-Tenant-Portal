namespace CovabeTenantPortal.Core.DTOs;

public record CovabeFloor(
    Guid Id,
    Guid PropertyId,
    Guid? BuildingId,
    int Number,
    string? CustomId,
    int Status,
    int? UnitCount,
    List<CovabeUnit> Units);
