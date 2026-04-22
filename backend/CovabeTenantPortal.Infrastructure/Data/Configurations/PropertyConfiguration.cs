using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class PropertyConfiguration : IEntityTypeConfiguration<Property>
{
    public void Configure(EntityTypeBuilder<Property> builder)
    {
        builder.Property(p => p.Name).HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(1000);

        builder.HasOne(p => p.Admin)
            .WithMany(u => u.OwnedProperties)
            .HasForeignKey(p => p.AdminId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
