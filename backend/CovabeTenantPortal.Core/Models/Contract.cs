using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.Models;

public class Contract : BaseEntity
{
    public required Guid TenantId { get; set; }
    public User? Tenant { get; set; }

    public required Guid UnitId { get; set; }
    public Unit? Unit { get; set; }

    public required DateTimeOffset StartDate { get; set; }
    public required DateTimeOffset EndDate { get; set; }
    public DateTimeOffset? MoveInDate { get; set; }
    public DateTimeOffset? SignedAt { get; set; }

    public required decimal MonthlyRent { get; set; }
    public decimal? Deposit { get; set; }
    public required int RentDueDay { get; set; }

    public required int NoticePeriodMonths { get; set; }
    public decimal? AnnualRentAdjustmentPercent { get; set; }
    public bool IsIndexLinked { get; set; }

    public bool IncludesHeating { get; set; }
    public bool IncludesWater { get; set; }
    public bool IncludesElectricity { get; set; }
    public bool IncludesInternet { get; set; }

    public bool IsVATApplicable { get; set; }

    public string? SpecialConditions { get; set; }
    public string? ContractDocumentUrl { get; set; }

    public required ContractStatus Status { get; set; }

    public Guid? PreviousContractId { get; set; }
    public Contract? PreviousContract { get; set; }

    public ICollection<LoanedItem> LoanedItems { get; set; } = [];
}
