using Lean8.Core.Entities;
using Lean8.Core.Interfaces;
using Lean8.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Lean8.Infrastructure.Repositories;

public class Lean8Repository : ILean8Repository
{
    private readonly AppDbContext _context;

    public Lean8Repository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User> GetUserAsync()
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == 1);
        if (user == null)
        {
            user = new User
            {
                Id = 1,
                Name = "Lean8 User",
                HeightCm = 175,
                CurrentWeight = 86,
                TargetWeight = 65
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        return user;
    }

    public async Task<User> UpdateUserAsync(User updatedUser)
    {
        var user = await GetUserAsync();
        user.Name = updatedUser.Name;
        user.HeightCm = updatedUser.HeightCm;
        user.CurrentWeight = updatedUser.CurrentWeight;
        user.TargetWeight = updatedUser.TargetWeight;
        user.WorkoutTime = updatedUser.WorkoutTime;
        user.SleepTime = updatedUser.SleepTime;
        user.ProteinTargetGrams = updatedUser.ProteinTargetGrams;

        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<List<WeightLog>> GetWeightLogsAsync()
    {
        return await _context.WeightLogs
            .OrderBy(w => w.Date)
            .ToListAsync();
    }

    public async Task<WeightLog?> GetLatestWeightLogAsync()
    {
        return await _context.WeightLogs
            .OrderByDescending(w => w.Date)
            .FirstOrDefaultAsync();
    }

    public async Task<WeightLog> AddWeightLogAsync(WeightLog weightLog)
    {
        var existing = await _context.WeightLogs.FirstOrDefaultAsync(w => w.Date == weightLog.Date);
        if (existing != null)
        {
            existing.Weight = weightLog.Weight;
            existing.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.WeightLogs.Add(weightLog);
        }

        // Also update current weight on User model
        var user = await GetUserAsync();
        user.CurrentWeight = weightLog.Weight;

        await _context.SaveChangesAsync();
        return existing ?? weightLog;
    }

    public async Task<DailyLog?> GetDailyLogByDateAsync(string date)
    {
        return await _context.DailyLogs.FirstOrDefaultAsync(d => d.Date == date);
    }

    public async Task<DailyLog> UpsertDailyLogAsync(DailyLog dailyLog)
    {
        var existing = await _context.DailyLogs.FirstOrDefaultAsync(d => d.Date == dailyLog.Date);
        if (existing != null)
        {
            existing.Workout = dailyLog.Workout;
            existing.IFCompleted = dailyLog.IFCompleted;
            existing.ProteinCompleted = dailyLog.ProteinCompleted;
            existing.WaterCompleted = dailyLog.WaterCompleted;
            existing.SleepCompleted = dailyLog.SleepCompleted;
            existing.NoSnack = dailyLog.NoSnack;
            existing.Notes = dailyLog.Notes;
        }
        else
        {
            _context.DailyLogs.Add(dailyLog);
        }

        await _context.SaveChangesAsync();
        return existing ?? dailyLog;
    }

    public async Task<List<DailyLog>> GetRecentDailyLogsAsync(int days)
    {
        return await _context.DailyLogs
            .OrderByDescending(d => d.Date)
            .Take(days)
            .ToListAsync();
    }
}
