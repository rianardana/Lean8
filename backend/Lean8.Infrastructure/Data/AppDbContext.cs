using Lean8.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Lean8.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<WeightLog> WeightLogs => Set<WeightLog>();
    public DbSet<DailyLog> DailyLogs => Set<DailyLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<WeightLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Date).IsUnique();
        });

        modelBuilder.Entity<DailyLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Date).IsUnique();
        });

        // Seed initial single-user profile
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Name = "Lean8 User",
            HeightCm = 175,
            CurrentWeight = 86,
            TargetWeight = 65,
            WorkoutTime = "07:00",
            SleepTime = "22:00",
            ProteinTargetGrams = 120
        });

        // Seed initial weight log for baseline progress
        modelBuilder.Entity<WeightLog>().HasData(new WeightLog
        {
            Id = 1,
            Date = "2026-08-06",
            Weight = 86.0,
            CreatedAt = new DateTime(2026, 8, 6, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
