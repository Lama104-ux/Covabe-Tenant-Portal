namespace CovabeTenantPortal.Core.DTOs;

public record CovabeProperty(
    Guid Id,
    int? CovabePropertyId,
    string? CustomId,
    string? Name,
    string? Address,
    string? City,
    string? Country,
    string? Description,
    int Status);
