namespace CovabeTenantPortal.Core.DTOs;

public record LoginResponse(string Token, DateTimeOffset ExpiresAt, UserDto User);
