namespace CovabeTenantPortal.Core.DTOs;

public record CovabeUnit(
    Guid Id,
    Guid PropertyId,
    Guid? BuildingId,
    Guid? FloorId,
    string? CustomUnitId,
    string? Code,
    int Type,
    decimal Area,
    int Status,
    string? OccupantFirstName,
    string? OccupantLastName,
    string? OccupantEmail,
    string? OccupantPhone);
