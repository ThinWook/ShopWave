using Microsoft.EntityFrameworkCore;

namespace ShopWave.Models
{
    public class ShopWaveDbContext : DbContext
    {
        public ShopWaveDbContext(DbContextOptions<ShopWaveDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<UserSetting> UserSettings { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }
        public DbSet<Media> Media { get; set; }
        public DbSet<ProductMedia> ProductMedia { get; set; }
        public DbSet<UserMedia> UserMedia { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }

        // New DbSets
        public DbSet<ProductOption> ProductOptions { get; set; }
        public DbSet<OptionValue> OptionValues { get; set; }
        public DbSet<VariantValue> VariantValues { get; set; }
        
        // Cart and Discount DbSets
        public DbSet<Discount> Discounts { get; set; }
        public DbSet<AppliedDiscount> AppliedDiscounts { get; set; }
        public DbSet<DiscountTier> DiscountTiers { get; set; }
        
        // Payment Transactions
        public DbSet<Transaction> Transactions { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer();
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ProductVariant>()
                .Property(v => v.Price)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<ProductVariant>()
                .Property(v => v.Stock)
                .HasColumnType("int");

            modelBuilder.Entity<CartItem>()
                .Property(ci => ci.UnitPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.TotalPrice)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Category>()
                .HasOne(c => c.ParentCategory)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Cart relationships
            modelBuilder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cart>()
                .HasIndex(c => c.SessionId);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.CartItems)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.ProductVariant)
                .WithMany()
                .HasForeignKey(ci => ci.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);

            // Discount relationships
            modelBuilder.Entity<Discount>()
                .HasIndex(d => d.Code)
                .IsUnique();

            modelBuilder.Entity<AppliedDiscount>()
                .HasOne(ad => ad.Cart)
                .WithMany(c => c.AppliedDiscounts)
                .HasForeignKey(ad => ad.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AppliedDiscount>()
                .HasOne(ad => ad.Discount)
                .WithMany(d => d.AppliedDiscounts)
                .HasForeignKey(ad => ad.DiscountId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.Order)
                .WithMany(o => o.OrderItems)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderItem>()
                .HasOne(oi => oi.ProductVariant)
                .WithMany()
                .HasForeignKey(oi => oi.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSetting>()
                .HasOne(us => us.User)
                .WithMany(u => u.UserSettings)
                .HasForeignKey(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSession>()
                .HasOne(us => us.User)
                .WithMany(u => u.UserSessions)
                .HasForeignKey(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSetting>()
                .HasIndex(us => new { us.UserId, us.SettingKey })
                .IsUnique();

            // Media table configuration
            modelBuilder.Entity<Media>()
                .Property(m => m.Id)
                .ValueGeneratedOnAdd();
            modelBuilder.Entity<Media>()
                .Property(m => m.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");
            modelBuilder.Entity<Media>()
                .Property(m => m.Url)
                .IsRequired();

            // ProductMedia
            modelBuilder.Entity<ProductMedia>()
                .HasKey(pm => new { pm.ProductId, pm.MediaId });
            modelBuilder.Entity<ProductMedia>()
                .Property(pm => pm.DisplayOrder)
                .HasDefaultValue(0);
            modelBuilder.Entity<ProductMedia>()
                .HasOne(pm => pm.Product)
                .WithMany(p => p.ProductMedia)
                .HasForeignKey(pm => pm.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ProductMedia>()
                .HasOne(pm => pm.Media)
                .WithMany()
                .HasForeignKey(pm => pm.MediaId)
                .OnDelete(DeleteBehavior.Cascade);

            // UserMedia
            modelBuilder.Entity<UserMedia>()
                .HasKey(um => new { um.UserId, um.MediaId, um.MediaType });
            modelBuilder.Entity<UserMedia>()
                .Property(um => um.MediaType)
                .HasMaxLength(50)
                .IsRequired()
                .HasColumnType("varchar(50)");
            modelBuilder.Entity<UserMedia>()
                .HasOne(um => um.User)
                .WithMany(u => u.UserMedia)
                .HasForeignKey(um => um.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<UserMedia>()
                .HasOne(um => um.Media)
                .WithMany()
                .HasForeignKey(um => um.MediaId)
                .OnDelete(DeleteBehavior.Cascade);

            // New: product options and option values
            modelBuilder.Entity<ProductOption>()
                .HasOne(po => po.Product)
                .WithMany(p => p.Options)
                .HasForeignKey(po => po.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OptionValue>()
                .HasOne(ov => ov.Option)
                .WithMany(o => o.Values)
                .HasForeignKey(ov => ov.OptionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OptionValue>()
                .HasOne(ov => ov.Thumbnail)
                .WithMany()
                .HasForeignKey(ov => ov.ThumbnailId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<VariantValue>()
                .HasKey(vv => new { vv.VariantId, vv.ValueId });

            modelBuilder.Entity<VariantValue>()
                .HasOne(vv => vv.Variant)
                .WithMany(v => v.VariantValues)
                .HasForeignKey(vv => vv.VariantId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<VariantValue>()
                .HasOne(vv => vv.Value)
                .WithMany()
                .HasForeignKey(vv => vv.ValueId)
                .OnDelete(DeleteBehavior.Restrict);

            // Transaction relationships
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Order)
                .WithMany(o => o.Transactions)
                .HasForeignKey(t => t.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Transaction>()
                .HasIndex(t => t.GatewayTransactionId);

            modelBuilder.Entity<Transaction>()
                .HasIndex(t => new { t.OrderId, t.Status });
        }
    }
}