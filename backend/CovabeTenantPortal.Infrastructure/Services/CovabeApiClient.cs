using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using CovabeTenantPortal.Core.DTOs;
using CovabeTenantPortal.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CovabeTenantPortal.Infrastructure.Services;

public class CovabeApiClient(
    IHttpClientFactory httpClientFactory,
    IOptions<CovabeApiSettings> settings,
    ILogger<CovabeApiClient> logger) : ICovabeApiClient
{
    private readonly CovabeApiSettings _settings = settings.Value;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private string? _cachedToken;
    private DateTimeOffset _tokenExpiresAt = DateTimeOffset.MinValue;

    public async Task<List<CovabeProperty>> GetPropertiesByOwnerEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var token = await GetAccessTokenAsync(cancellationToken);
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");

        var memberUrl = $"{_settings.CovabeServiceUrl.TrimEnd('/')}/api/app/member/tenant-member-by-email?email={Uri.EscapeDataString(email)}";
        var memberResponse = await client.GetAsync(memberUrl, cancellationToken);

        if (memberResponse.StatusCode == HttpStatusCode.NotFound)
        {
            logger.LogInformation("No Covabe member found for email {Email}", email);
            return [];
        }

        if (!memberResponse.IsSuccessStatusCode)
        {
            logger.LogWarning("Covabe member lookup failed: {Status}", memberResponse.StatusCode);
            return [];
        }

        var member = await memberResponse.Content.ReadFromJsonAsync<MemberDto>(cancellationToken: cancellationToken);
        if (member is null || member.UserId == Guid.Empty)
            return [];

        var propertiesUrl = $"{_settings.PropertyServiceUrl.TrimEnd('/')}/api/app/property/by-owner-id/{member.UserId}";
        var propertiesResponse = await client.GetAsync(propertiesUrl, cancellationToken);

        if (!propertiesResponse.IsSuccessStatusCode)
        {
            logger.LogWarning("Covabe property lookup failed: {Status}", propertiesResponse.StatusCode);
            return [];
        }

        var properties = await propertiesResponse.Content.ReadFromJsonAsync<List<CovabeProperty>>(cancellationToken: cancellationToken);
        return properties ?? [];
    }

    private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        if (_cachedToken is not null && _tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
            return _cachedToken;

        await _tokenLock.WaitAsync(cancellationToken);
        try
        {
            if (_cachedToken is not null && _tokenExpiresAt > DateTimeOffset.UtcNow.AddMinutes(1))
                return _cachedToken;

            var client = httpClientFactory.CreateClient();
            var tokenUrl = $"{_settings.AuthorityUrl.TrimEnd('/')}/connect/token";
            var form = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "client_credentials"),
                new KeyValuePair<string, string>("client_id", _settings.ClientId),
                new KeyValuePair<string, string>("client_secret", _settings.ClientSecret),
                new KeyValuePair<string, string>("scope", _settings.Scope),
            });

            var response = await client.PostAsync(tokenUrl, form, cancellationToken);
            response.EnsureSuccessStatusCode();
            var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(cancellationToken: cancellationToken)
                ?? throw new InvalidOperationException("Empty token response from Covabe Auth Service");

            _cachedToken = tokenResponse.AccessToken;
            _tokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokenResponse.ExpiresIn);
            return _cachedToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    private sealed record TokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("expires_in")] int ExpiresIn,
        [property: JsonPropertyName("token_type")] string TokenType);

    private sealed record MemberDto(int Id, Guid UserId, string? Email);
}
