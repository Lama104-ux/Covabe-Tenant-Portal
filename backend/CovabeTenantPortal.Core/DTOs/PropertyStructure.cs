namespace CovabeTenantPortal.Core.DTOs;

public record PropertyStructure(
    int PropertyStatus,
    List<CovabeBuilding> Buildings,
    List<CovabeUnit> PropertyUnits);
