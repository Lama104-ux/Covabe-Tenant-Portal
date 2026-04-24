namespace CovabeTenantPortal.Infrastructure.Services;

public class InvitationSettings
{
    public int ExpiryHours { get; set; } = 72;
    public string AcceptUrlBase { get; set; } = string.Empty;
}
