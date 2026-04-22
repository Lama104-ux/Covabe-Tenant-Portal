using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class LoanedItemConfiguration : IEntityTypeConfiguration<LoanedItem>
{
    public void Configure(EntityTypeBuilder<LoanedItem> builder)
    {
        builder.Property(l => l.Description).HasMaxLength(500);

        builder.HasOne(l => l.Contract)
            .WithMany(c => c.LoanedItems)
            .HasForeignKey(l => l.ContractId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
