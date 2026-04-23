using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CovabeTenantPortal.Core.Interfaces;
using CovabeTenantPortal.Core.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CovabeTenantPortal.Infrastructure.Services;

public class JwtService(IOptions<JwtSettings> settings) : IJwtService
{
    private readonly JwtSettings _settings = settings.Value;

    public (string Token, DateTimeOffset ExpiresAt) GenerateToken(User user)
    {
        var expiresAt = DateTimeOffset.UtcNow.AddHours(_settings.ExpiryHours);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("firstName", user.FirstName),
            new("lastName", user.LastName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
