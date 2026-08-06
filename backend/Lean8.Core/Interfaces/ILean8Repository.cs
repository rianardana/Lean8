using Lean8.Core.Entities;

namespace Lean8.Core.Interfaces;

public interface ILean8Repository
{
    Task<User> GetUserAsync();
    Task<User> UpdateUserAsync(User user);
    
    Task<List<WeightLog>> GetWeightLogsAsync();
    Task<WeightLog?> GetLatestWeightLogAsync();
    Task<WeightLog> AddWeightLogAsync(WeightLog weightLog);

    Task<DailyLog?> GetDailyLogByDateAsync(string date);
    Task<DailyLog> UpsertDailyLogAsync(DailyLog dailyLog);
    Task<List<DailyLog>> GetRecentDailyLogsAsync(int days);
}
