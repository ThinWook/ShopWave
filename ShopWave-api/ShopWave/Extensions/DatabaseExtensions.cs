using Microsoft.EntityFrameworkCore;
using ShopWave.Models;

namespace ShopWave.Extensions
{
    public static class DatabaseExtensions
    {
        public static void SeedDatabase(this IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ShopWaveDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

            try
            {
                // Check if database exists and can connect
                if (!context.Database.CanConnect())
                {
                    logger.LogWarning("Cannot connect to database - skipping seeding");
                    return;
                }

                logger.LogInformation("Starting database seeding...");

                // Ensure Users table exists
                try
                {
                    var userCount = context.Users.Count();
                    logger.LogInformation("Found {UserCount} existing users", userCount);
                }
                catch (Exception)
                {
                    logger.LogWarning("Users table doesn't exist - skipping seeding. Run 'dotnet ef database update' first.");
                    return;
                }

                // Only seed a default admin user if no users exist.
                if (!context.Users.Any())
                {
                    var adminUser = new User
                    {
                        Email = "admin@shopwave.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                        FullName = "Administrator",
                        Phone = null,
                        Role = "Admin",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    context.Users.Add(adminUser);
                    context.SaveChanges();
                    logger.LogInformation("Seeded default admin user: admin@shopwave.com / admin123");
                }
                else
                {
                    logger.LogInformation("Users exist - skipping admin seeding");
                }

                logger.LogInformation("Database seeding completed (only admin retained).");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Database seeding failed: {ErrorMessage}", ex.Message);
                logger.LogInformation("This is normal if migrations haven't been run yet. Run: dotnet ef database update");
            }
        }
    }
}