using CovabeTenantPortal.Core.Interfaces;
using CovabeTenantPortal.Core.Models;
using CovabeTenantPortal.Core.Models.Enums;
using CovabeTenantPortal.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CovabeTenantPortal.Infrastructure.Seeding;

public class SuperAdminSeeder(
    IServiceProvider services,
    ILogger<SuperAdminSeeder> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasherService>();
        var settings = scope.ServiceProvider.GetRequiredService<IOptions<SuperAdminSettings>>().Value;

        await context.Database.MigrateAsync(cancellationToken);

        var alreadyExists = await context.Users.AnyAsync(u => u.Role == Role.SuperAdmin, cancellationToken);
        if (alreadyExists)
        {
            logger.LogInformation("SuperAdmin already exists, skipping seed.");
            return;
        }

        if (string.IsNullOrWhiteSpace(settings.Email)
            || string.IsNullOrWhiteSpace(settings.Password)
            || string.IsNullOrWhiteSpace(settings.FirstName)
            || string.IsNullOrWhiteSpace(settings.LastName))
        {
            logger.LogWarning("SuperAdmin config incomplete, skipping seed. Set values via dotnet user-secrets.");
            return;
        }

        var user = new User
        {
            Email = settings.Email,
            PasswordHash = passwordHasher.Hash(settings.Password),
            FirstName = settings.FirstName,
            LastName = settings.LastName,
            Role = Role.SuperAdmin,
            IsActive = true
        };

        context.Users.Add(user);
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("SuperAdmin {Email} created.", settings.Email);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
