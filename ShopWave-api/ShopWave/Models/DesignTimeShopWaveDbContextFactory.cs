using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace ShopWave.Models
{
    // Design-time factory for EF Core tools. This lets `dotnet ef` create the DbContext
    // without building the entire application DI container.
    public class DesignTimeShopWaveDbContextFactory : IDesignTimeDbContextFactory<ShopWaveDbContext>
    {
        public ShopWaveDbContext CreateDbContext(string[] args)
        {
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
            var basePath = Directory.GetCurrentDirectory();

            var config = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{env}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var conn = config.GetConnectionString("DefaultConnection")
                       ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

            if (string.IsNullOrEmpty(conn))
                throw new InvalidOperationException("Connection string 'DefaultConnection' not found for design-time DbContext creation.");

            var optionsBuilder = new DbContextOptionsBuilder<ShopWaveDbContext>();
            optionsBuilder.UseSqlServer(conn);

            return new ShopWaveDbContext(optionsBuilder.Options);
        }
    }
}
