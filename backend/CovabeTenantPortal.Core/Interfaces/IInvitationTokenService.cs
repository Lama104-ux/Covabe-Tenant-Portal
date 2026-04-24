namespace CovabeTenantPortal.Core.Interfaces;

public interface IInvitationTokenService
{
    string GenerateToken();
    string Hash(string token);
}
