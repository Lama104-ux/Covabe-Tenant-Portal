namespace CovabeTenantPortal.Core.Models;

public class News : BaseEntity
{
    public required Guid PropertyId { get; set; }
    public Property? Property { get; set; }

    public required Guid AuthorId { get; set; }
    public User? Author { get; set; }

    public required string Title { get; set; }
    public required string Body { get; set; }
    public string? ImageUrl { get; set; }

    public required DateTimeOffset PublishedAt { get; set; }
}
