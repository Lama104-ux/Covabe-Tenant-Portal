using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.DTOs;

public record UserDto(Guid Id, string Email, string FirstName, string LastName, Role Role);
