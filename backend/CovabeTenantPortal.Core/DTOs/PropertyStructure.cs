namespace CovabeTenantPortal.Core.DTOs;

public record PropertyStructure(
    List<CovabeBuilding> Buildings,
    List<CovabeUnit> PropertyUnits);
