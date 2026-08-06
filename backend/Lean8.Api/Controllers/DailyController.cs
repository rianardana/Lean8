using Lean8.Core.Dtos;
using Lean8.Core.Entities;
using Lean8.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lean8.Api.Controllers;

[ApiController]
public class DailyController : ControllerBase
{
    private readonly ILean8Repository _repository;

    public DailyController(ILean8Repository repository)
    {
        _repository = repository;
    }

    [HttpGet("daily/{date}")]
    [HttpGet("api/daily/{date}")]
    public async Task<ActionResult<DailyLogDto>> GetDailyLog(string date)
    {
        var log = await _repository.GetDailyLogByDateAsync(date);
        if (log == null)
        {
            return Ok(new DailyLogDto
            {
                Id = 0,
                Date = date,
                Workout = false,
                IFCompleted = false,
                ProteinCompleted = false,
                WaterCompleted = false,
                SleepCompleted = false,
                NoSnack = false,
                Notes = null,
                CompletedCount = 0
            });
        }

        return Ok(MapToDto(log));
    }

    [HttpPost("daily")]
    [HttpPost("api/daily")]
    public async Task<ActionResult<DailyLogDto>> UpsertDailyLog([FromBody] UpdateDailyLogDto input)
    {
        var entity = new DailyLog
        {
            Date = input.Date,
            Workout = input.Workout,
            IFCompleted = input.IFCompleted,
            ProteinCompleted = input.ProteinCompleted,
            WaterCompleted = input.WaterCompleted,
            SleepCompleted = input.SleepCompleted,
            NoSnack = input.NoSnack,
            Notes = input.Notes
        };

        var saved = await _repository.UpsertDailyLogAsync(entity);
        return Ok(MapToDto(saved));
    }

    private static DailyLogDto MapToDto(DailyLog log)
    {
        int count = 0;
        if (log.Workout) count++;
        if (log.IFCompleted) count++;
        if (log.ProteinCompleted) count++;
        if (log.WaterCompleted) count++;
        if (log.SleepCompleted) count++;
        if (log.NoSnack) count++;

        return new DailyLogDto
        {
            Id = log.Id,
            Date = log.Date,
            Workout = log.Workout,
            IFCompleted = log.IFCompleted,
            ProteinCompleted = log.ProteinCompleted,
            WaterCompleted = log.WaterCompleted,
            SleepCompleted = log.SleepCompleted,
            NoSnack = log.NoSnack,
            Notes = log.Notes,
            CompletedCount = count
        };
    }
}
