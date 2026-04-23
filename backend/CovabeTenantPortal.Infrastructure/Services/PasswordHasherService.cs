using CovabeTenantPortal.Core.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace CovabeTenantPortal.Infrastructure.Services;

public class PasswordHasherService : IPasswordHasherService
{
    private readonly PasswordHasher<object> _hasher = new();
    private static readonly object _context = new();

    public string Hash(string password) => _hasher.HashPassword(_context, password);

    public bool Verify(string hash, string password)
    {
        var result = _hasher.VerifyHashedPassword(_context, hash, password);
        return result == PasswordVerificationResult.Success
            || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}
