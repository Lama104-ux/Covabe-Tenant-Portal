using System.ComponentModel.DataAnnotations;

namespace CovabeTenantPortal.Core.DTOs;

public record AcceptInvitationRequest(
    [Required] string Token,
    [Required, MinLength(2)] string FirstName,
    [Required, MinLength(2)] string LastName,
    [Required, MinLength(8)] string Password,
    string? PhoneNumber);
