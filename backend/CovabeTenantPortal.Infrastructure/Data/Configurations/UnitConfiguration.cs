using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class UnitConfiguration : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.Property(u => u.Name).HasMaxLength(100);
        builder.Property(u => u.Description).HasMaxLength(500);
        builder.Property(u => u.Area).HasPrecision(10, 2);

        builder.Property(u => u.Street).HasMaxLength(200);
        builder.Property(u => u.PostalCode).HasMaxLength(20);
        builder.Property(u => u.City).HasMaxLength(100);

        builder.HasOne(u => u.Property)
            .WithMany(p => p.Units)
            .HasForeignKey(u => u.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Building)
            .WithMany(b => b.Units)
            .HasForeignKey(u => u.BuildingId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(u => u.Floor)
            .WithMany(f => f.Units)
            .HasForeignKey(u => u.FloorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
