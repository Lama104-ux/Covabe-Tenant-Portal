using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.Models;

public class LoanedItem : BaseEntity
{
    public required Guid ContractId { get; set; }
    public Contract? Contract { get; set; }

    public required LoanedItemType ItemType { get; set; }
    public required string Description { get; set; }

    public required DateTimeOffset LoanedDate { get; set; }
    public DateTimeOffset? ReturnedDate { get; set; }
}
