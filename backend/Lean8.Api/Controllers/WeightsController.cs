using Lean8.Core.Dtos;
using Lean8.Core.Entities;
using Lean8.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Lean8.Api.Controllers;

[ApiController]
public class WeightsController : ControllerBase
{
    private readonly ILean8Repository _repository;

    public WeightsController(ILean8Repository repository)
    {
        _repository = repository;
    }

    [HttpGet("weights")]
    [HttpGet("api/weights")]
    public async Task<ActionResult<List<WeightLogDto>>> GetWeights()
    {
        var logs = await _repository.GetWeightLogsAsync();
        var dtos = logs.Select(l => new WeightLogDto
        {
            Id = l.Id,
            Date = l.Date,
            Weight = l.Weight
        }).ToList();

        return Ok(dtos);
    }

    [HttpPost("weights")]
    [HttpPost("api/weights")]
    public async Task<ActionResult<WeightLogDto>> AddWeight([FromBody] CreateWeightLogDto input)
    {
        var date = string.IsNullOrWhiteSpace(input.Date) 
            ? DateTime.UtcNow.ToString("yyyy-MM-dd") 
            : input.Date;

        var entity = new WeightLog
        {
            Date = date,
            Weight = input.Weight
        };

        var saved = await _repository.AddWeightLogAsync(entity);

        return Ok(new WeightLogDto
        {
            Id = saved.Id,
            Date = saved.Date,
            Weight = saved.Weight
        });
    }
}
