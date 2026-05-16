namespace CovabeTenantPortal.Core.DTOs;

public record AssignUnitRequest(
    string TenantFirstName,
    string TenantLastName,
    string TenantEmail,
    string? TenantPhone);
