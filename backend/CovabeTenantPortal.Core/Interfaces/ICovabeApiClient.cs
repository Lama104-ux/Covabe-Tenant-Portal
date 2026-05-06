using CovabeTenantPortal.Core.DTOs;

namespace CovabeTenantPortal.Core.Interfaces;

public interface ICovabeApiClient
{
    Task<List<CovabeProperty>> GetPropertiesByOwnerEmailAsync(string email, CancellationToken cancellationToken = default);
}
