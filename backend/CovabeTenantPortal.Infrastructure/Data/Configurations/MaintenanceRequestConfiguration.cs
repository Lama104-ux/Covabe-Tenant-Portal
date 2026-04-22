using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class MaintenanceRequestConfiguration : IEntityTypeConfiguration<MaintenanceRequest>
{
    public void Configure(EntityTypeBuilder<MaintenanceRequest> builder)
    {
        builder.Property(m => m.Title).HasMaxLength(200);
        builder.Property(m => m.Description).HasMaxLength(2000);
        builder.Property(m => m.CovabeWorkOrderId).HasMaxLength(100);
        builder.Property(m => m.LastKnownStatus).HasMaxLength(100);

        builder.HasOne(m => m.Tenant)
            .WithMany(u => u.MaintenanceRequests)
            .HasForeignKey(m => m.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Unit)
            .WithMany(u => u.MaintenanceRequests)
            .HasForeignKey(m => m.UnitId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
