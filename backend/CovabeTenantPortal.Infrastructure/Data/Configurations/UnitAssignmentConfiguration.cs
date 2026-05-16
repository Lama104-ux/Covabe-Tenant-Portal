using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class UnitAssignmentConfiguration : IEntityTypeConfiguration<UnitAssignment>
{
    public void Configure(EntityTypeBuilder<UnitAssignment> builder)
    {
        builder.HasIndex(a => a.UnitId).IsUnique();
        builder.HasIndex(a => a.PropertyId);

        builder.Property(a => a.TenantFirstName).HasMaxLength(100);
        builder.Property(a => a.TenantLastName).HasMaxLength(100);
        builder.Property(a => a.TenantEmail).HasMaxLength(256);
        builder.Property(a => a.TenantPhone).HasMaxLength(32);

        builder.HasOne(a => a.AssignedBy)
            .WithMany()
            .HasForeignKey(a => a.AssignedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Invitation)
            .WithMany()
            .HasForeignKey(a => a.InvitationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
