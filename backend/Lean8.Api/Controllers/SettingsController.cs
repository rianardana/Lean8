using Lean8.Core.Dtos;
using Lean8.Core.Entities;
using Lean8.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lean8.Api.Controllers;

[ApiController]
public class SettingsController : ControllerBase
{
    private readonly ILean8Repository _repository;

    public SettingsController(ILean8Repository repository)
    {
        _repository = repository;
    }

    [HttpGet("settings")]
    [HttpGet("api/settings")]
    public async Task<ActionResult<UserSettingsDto>> GetSettings()
    {
        var user = await _repository.GetUserAsync();
        return Ok(MapToDto(user));
    }

    [HttpPost("settings")]
    [HttpPost("api/settings")]
    public async Task<ActionResult<UserSettingsDto>> UpdateSettings([FromBody] UserSettingsDto input)
    {
        var entity = new User
        {
            Id = 1,
            Name = input.Name,
            HeightCm = input.HeightCm,
            CurrentWeight = input.CurrentWeight,
            TargetWeight = input.TargetWeight,
            WorkoutTime = input.WorkoutTime,
            SleepTime = input.SleepTime,
            ProteinTargetGrams = input.ProteinTargetGrams
        };

        var updated = await _repository.UpdateUserAsync(entity);
        return Ok(MapToDto(updated));
    }

    private static UserSettingsDto MapToDto(User user)
    {
        return new UserSettingsDto
        {
            Name = user.Name,
            HeightCm = user.HeightCm,
            CurrentWeight = user.CurrentWeight,
            TargetWeight = user.TargetWeight,
            WorkoutTime = user.WorkoutTime,
            SleepTime = user.SleepTime,
            ProteinTargetGrams = user.ProteinTargetGrams
        };
    }
}
