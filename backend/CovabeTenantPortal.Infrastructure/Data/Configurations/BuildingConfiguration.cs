using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class BuildingConfiguration : IEntityTypeConfiguration<Building>
{
    public void Configure(EntityTypeBuilder<Building> builder)
    {
        builder.Property(b => b.Name).HasMaxLength(200);
        builder.Property(b => b.Street).HasMaxLength(200);
        builder.Property(b => b.PostalCode).HasMaxLength(20);
        builder.Property(b => b.City).HasMaxLength(100);

        builder.HasOne(b => b.Property)
            .WithMany(p => p.Buildings)
            .HasForeignKey(b => b.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
