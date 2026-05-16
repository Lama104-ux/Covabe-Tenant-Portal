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
        var client = await CreateAuthorizedClientAsync(cancellationToken);

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

    public async Task<PropertyStructure> GetPropertyStructureAsync(
        string ownerEmail,
        Guid propertyId,
        IReadOnlyDictionary<Guid, UnitOccupant>? occupants = null,
        CancellationToken cancellationToken = default)
    {
        var properties = await GetPropertiesByOwnerEmailAsync(ownerEmail, cancellationToken);
        var property = properties.FirstOrDefault(p => p.Id == propertyId);
        if (property is null)
        {
            logger.LogInformation("Property {PropertyId} not owned by {Email}", propertyId, ownerEmail);
            return new PropertyStructure(0, [], []);
        }

        var (buildings, floors, units) = await FetchBuildingStructureAsync(propertyId, cancellationToken);

        CovabeUnit MapUnit(RawUnitDto u)
        {
            UnitOccupant? occupant = null;
            if (occupants is not null && occupants.TryGetValue(u.Id, out var o)) occupant = o;
            return new CovabeUnit(
                u.Id, u.PropertyId, u.BuildingId, u.FloorId,
                u.CustomUnitId, u.Code, u.Type, u.Area, (int)u.Status,
                occupant?.FirstName, occupant?.LastName, occupant?.Email, occupant?.Phone);
        }

        var mappedBuildings = buildings
            .Select(b =>
            {
                var floorsForBuilding = floors
                    .Where(f => f.BuildingId == b.Id)
                    .OrderBy(f => f.Number)
                    .Select(f =>
                    {
                        var unitsForFloor = units
                            .Where(u => u.FloorId == f.Id)
                            .Select(MapUnit)
                            .ToList();
                        return new CovabeFloor(
                            f.Id, f.PropertyId, f.BuildingId, f.Number, f.CustomId,
                            (int)f.Status, f.UnitCount, unitsForFloor);
                    })
                    .ToList();

                var directUnits = units
                    .Where(u => u.BuildingId == b.Id && u.FloorId == null)
                    .Select(MapUnit)
                    .ToList();

                return new CovabeBuilding(
                    b.Id, b.PropertyId, b.Name, b.CustomId, (int)b.Status,
                    b.FloorCount, b.UnitCount, floorsForBuilding, directUnits);
            })
            .ToList();

        var propertyUnits = units
            .Where(u => u.BuildingId == null && u.FloorId == null)
            .Select(MapUnit)
            .ToList();

        return new PropertyStructure(property.Status, mappedBuildings, propertyUnits);
    }

    public async Task<UnitLookupResult?> FindUnitInPropertyAsync(
        string ownerEmail,
        Guid propertyId,
        Guid unitId,
        CancellationToken cancellationToken = default)
    {
        var properties = await GetPropertiesByOwnerEmailAsync(ownerEmail, cancellationToken);
        var property = properties.FirstOrDefault(p => p.Id == propertyId);
        if (property is null) return null;

        var (_, _, units) = await FetchBuildingStructureAsync(propertyId, cancellationToken);
        var match = units.FirstOrDefault(u => u.Id == unitId);
        if (match is null) return null;
        return new UnitLookupResult(match.Id, match.PropertyId, match.BuildingId, match.FloorId, property.Status);
    }

    private async Task<(List<RawBuildingDto> Buildings, List<RawFloorDto> Floors, List<RawUnitDto> Units)>
        FetchBuildingStructureAsync(Guid propertyId, CancellationToken cancellationToken)
    {
        var client = await CreateAuthorizedClientAsync(cancellationToken);
        var baseUrl = _settings.PropertyServiceUrl.TrimEnd('/');

        var buildings = await FetchListAsync<RawBuildingDto>(client,
            $"{baseUrl}/api/app/building/by-property-id/{propertyId}", cancellationToken);

        var floors = buildings.Count == 0
            ? new List<RawFloorDto>()
            : await FetchListAsync<RawFloorDto>(client,
                $"{baseUrl}/api/app/floor/by-property-id/{propertyId}", cancellationToken);

        // Always fetch units — Mark properties may have units directly under the property
        // without any buildings or floors.
        var units = await FetchListAsync<RawUnitDto>(client,
            $"{baseUrl}/api/app/unit/by-property-id/{propertyId}", cancellationToken);

        return (buildings, floors, units);
    }

    private async Task<List<T>> FetchListAsync<T>(HttpClient client, string url, CancellationToken cancellationToken)
    {
        var response = await client.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Covabe call failed: {Status} for {Url}", response.StatusCode, url);
            return new List<T>();
        }
        return await response.Content.ReadFromJsonAsync<List<T>>(cancellationToken: cancellationToken) ?? new List<T>();
    }

    private async Task<HttpClient> CreateAuthorizedClientAsync(CancellationToken cancellationToken)
    {
        var token = await GetAccessTokenAsync(cancellationToken);
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        client.DefaultRequestHeaders.Add("X-Requested-With", "XMLHttpRequest");
        return client;
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

    private sealed record RawBuildingDto(
        Guid Id, Guid PropertyId, string? Name, string? CustomId,
        int Status, int? FloorCount, int? UnitCount);

    private sealed record RawFloorDto(
        Guid Id, Guid PropertyId, Guid? BuildingId, int Number,
        string? CustomId, int Status, int? UnitCount);

    private sealed record RawUnitDto(
        Guid Id, Guid PropertyId, Guid? BuildingId, Guid? FloorId,
        string? CustomUnitId, string? Code, int Type, decimal Area, int Status);
}
