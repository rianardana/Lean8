using Lean8.Core.Dtos;
using Lean8.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lean8.Api.Controllers;

[ApiController]
public class AiReviewController : ControllerBase
{
    private readonly ILean8Repository _repository;
    private readonly IAiCoachService _aiCoachService;

    public AiReviewController(ILean8Repository repository, IAiCoachService aiCoachService)
    {
        _repository = repository;
        _aiCoachService = aiCoachService;
    }

    [HttpPost("ai/review")]
    [HttpPost("api/ai/review")]
    public async Task<ActionResult<AiReviewResponseDto>> GenerateReview([FromBody] AiReviewRequestDto? request)
    {
        var targetDate = request?.Date ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
        
        var user = await _repository.GetUserAsync();
        var todayLog = await _repository.GetDailyLogByDateAsync(targetDate);
        var recentLogs = await _repository.GetRecentDailyLogsAsync(7);
        var recentWeights = await _repository.GetWeightLogsAsync();

        var review = await _aiCoachService.GenerateReviewAsync(user, todayLog, recentLogs, recentWeights);
        return Ok(review);
    }
}
