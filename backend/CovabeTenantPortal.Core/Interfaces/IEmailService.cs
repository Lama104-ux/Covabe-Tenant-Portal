using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.Interfaces;

public interface IEmailService
{
    Task SendInvitationAsync(string toEmail, string acceptUrl, InvitationRole role);
}
