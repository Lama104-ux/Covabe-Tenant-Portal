using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class FloorConfiguration : IEntityTypeConfiguration<Floor>
{
    public void Configure(EntityTypeBuilder<Floor> builder)
    {
        builder.Property(f => f.Name).HasMaxLength(100);

        builder.HasOne(f => f.Building)
            .WithMany(b => b.Floors)
            .HasForeignKey(f => f.BuildingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
