using CovabeTenantPortal.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CovabeTenantPortal.Infrastructure.Data.Configurations;

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.Property(c => c.MonthlyRent).HasPrecision(18, 2);
        builder.Property(c => c.Deposit).HasPrecision(18, 2);
        builder.Property(c => c.AnnualRentAdjustmentPercent).HasPrecision(5, 2);

        builder.Property(c => c.SpecialConditions).HasMaxLength(2000);
        builder.Property(c => c.ContractDocumentUrl).HasMaxLength(500);

        builder.HasOne(c => c.Tenant)
            .WithMany(u => u.Contracts)
            .HasForeignKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Unit)
            .WithMany(u => u.Contracts)
            .HasForeignKey(c => c.UnitId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.PreviousContract)
            .WithMany()
            .HasForeignKey(c => c.PreviousContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
