using CovabeTenantPortal.Core.Interfaces;
using CovabeTenantPortal.Core.Models.Enums;
using Microsoft.Extensions.Logging;

namespace CovabeTenantPortal.Infrastructure.Services;

public class ConsoleEmailService(ILogger<ConsoleEmailService> logger) : IEmailService
{
    public Task SendInvitationAsync(string toEmail, string acceptUrl, InvitationRole role)
    {
        logger.LogInformation(
            "[EMAIL] Inbjudan ({Role}) skickad till {Email}. Aktiveringslänk: {Url}",
            role, toEmail, acceptUrl);
        return Task.CompletedTask;
    }
}
