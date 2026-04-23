using CovabeTenantPortal.Core.Models;

namespace CovabeTenantPortal.Core.Interfaces;

public interface IJwtService
{
    (string Token, DateTimeOffset ExpiresAt) GenerateToken(User user);
}
