namespace CovabeTenantPortal.Core.Models;

public class Message : BaseEntity
{
    public required Guid SenderId { get; set; }
    public User? Sender { get; set; }

    public required Guid ReceiverId { get; set; }
    public User? Receiver { get; set; }

    public required string Content { get; set; }
    public required DateTimeOffset SentAt { get; set; }
    public bool IsRead { get; set; }
}
