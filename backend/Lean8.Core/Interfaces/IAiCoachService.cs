using Lean8.Core.Dtos;
using Lean8.Core.Entities;

namespace Lean8.Core.Interfaces;

public interface IAiCoachService
{
    Task<AiReviewResponseDto> GenerateReviewAsync(
        User user, 
        DailyLog? todayLog, 
        List<DailyLog> recentLogs, 
        List<WeightLog> recentWeights);
}
