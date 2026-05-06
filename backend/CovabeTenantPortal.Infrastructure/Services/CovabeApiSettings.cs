namespace CovabeTenantPortal.Infrastructure.Services;

public class CovabeApiSettings
{
    public string AuthorityUrl { get; set; } = string.Empty;
    public string CovabeServiceUrl { get; set; } = string.Empty;
    public string PropertyServiceUrl { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Scope { get; set; } = "PropertyManagementService CovabeService";
}
