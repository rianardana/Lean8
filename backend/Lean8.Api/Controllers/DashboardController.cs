using Lean8.Core.Dtos;
using Lean8.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lean8.Api.Controllers;

[ApiController]
public class DashboardController : ControllerBase
{
    private readonly ILean8Repository _repository;

    public DashboardController(ILean8Repository repository)
    {
        _repository = repository;
    }

    [HttpGet("dashboard")]
    [HttpGet("api/dashboard")]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        var user = await _repository.GetUserAsync();
        var latestLog = await _repository.GetLatestWeightLogAsync();
        var allWeights = await _repository.GetWeightLogsAsync();
        var recentLogs = await _repository.GetRecentDailyLogsAsync(1000);

        var currentWeight = latestLog?.Weight ?? user.CurrentWeight;
        var startingWeight = allWeights.FirstOrDefault()?.Weight ?? 86.0;
        var targetWeight = user.TargetWeight;

        // Progress percentage (86 -> 65kg baseline)
        double progressPercentage = 0;
        var totalToLose = startingWeight - targetWeight;
        if (totalToLose > 0)
        {
            var lost = startingWeight - currentWeight;
            progressPercentage = Math.Clamp(Math.Round((lost / totalToLose) * 100, 1), 0, 100);
        }

        // Active days count
        var activeDays = recentLogs.Select(l => l.Date).Distinct().Count();
        if (activeDays == 0 && allWeights.Any()) activeDays = 1;

        return Ok(new DashboardDto
        {
            CurrentWeight = currentWeight,
            TargetWeight = targetWeight,
            StartingWeight = startingWeight,
            ProgressPercentage = progressPercentage,
            ActiveDays = activeDays,
            UserHandshakeName = user.Name
        });
    }
}
