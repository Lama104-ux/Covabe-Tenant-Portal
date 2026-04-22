using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.Models;

public class User : BaseEntity
{
    public required string Email { get; set; }
    public string? PasswordHash { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public required Role Role { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Property> OwnedProperties { get; set; } = [];
    public ICollection<Contract> Contracts { get; set; } = [];
    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<Message> SentMessages { get; set; } = [];
    public ICollection<Message> ReceivedMessages { get; set; } = [];
    public ICollection<News> AuthoredNews { get; set; } = [];
    public ICollection<Invitation> SentInvitations { get; set; } = [];
}
