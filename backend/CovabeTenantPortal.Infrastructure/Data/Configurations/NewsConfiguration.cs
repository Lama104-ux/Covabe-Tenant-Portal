using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class NewsConfiguration : IEntityTypeConfiguration<News>
{
    public void Configure(EntityTypeBuilder<News> builder)
    {
        builder.Property(n => n.Title).HasMaxLength(200);
        builder.Property(n => n.ImageUrl).HasMaxLength(500);

        builder.HasOne(n => n.Property)
            .WithMany(p => p.News)
            .HasForeignKey(n => n.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Author)
            .WithMany(u => u.AuthoredNews)
            .HasForeignKey(n => n.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
