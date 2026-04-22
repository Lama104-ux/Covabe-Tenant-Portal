using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        builder.HasIndex(i => i.TokenHash).IsUnique();

        builder.Property(i => i.Email).HasMaxLength(256);
        builder.Property(i => i.TokenHash).HasMaxLength(512);

        builder.HasOne(i => i.InvitedBy)
            .WithMany(u => u.SentInvitations)
            .HasForeignKey(i => i.InvitedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
