using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using CovabeTenantPortal.Core.Interfaces;

namespace CovabeTenantPortal.Infrastructure.Services;

public class InvitationTokenService : IInvitationTokenService
{
    public string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Base64Url.EncodeToString(bytes);
    }

    public string Hash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
