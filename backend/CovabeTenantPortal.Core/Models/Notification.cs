using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.Models;

public class Notification : BaseEntity
{
    public required Guid UserId { get; set; }
    public User? User { get; set; }

    public required NotificationType Type { get; set; }
    public required string Title { get; set; }
    public required string Body { get; set; }

    public Guid? LinkedEntityId { get; set; }
    public bool IsRead { get; set; }
}
