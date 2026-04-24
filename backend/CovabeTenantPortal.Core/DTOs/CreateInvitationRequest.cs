using System.ComponentModel.DataAnnotations;
using CovabeTenantPortal.Core.Models.Enums;

namespace CovabeTenantPortal.Core.DTOs;

public record CreateInvitationRequest(
    [Required, EmailAddress] string Email,
    [Required] InvitationRole Role);
