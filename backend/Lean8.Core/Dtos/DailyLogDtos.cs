namespace Lean8.Core.Dtos;

public class DailyLogDto
{
    public int Id { get; set; }
    public string Date { get; set; } = string.Empty;
    public bool Workout { get; set; }
    public bool IFCompleted { get; set; }
    public bool ProteinCompleted { get; set; }
    public bool WaterCompleted { get; set; }
    public bool SleepCompleted { get; set; }
    public bool NoSnack { get; set; }
    public string? Notes { get; set; }
    public int CompletedCount { get; set; }
}

public class UpdateDailyLogDto
{
    public string Date { get; set; } = string.Empty;
    public bool Workout { get; set; }
    public bool IFCompleted { get; set; }
    public bool ProteinCompleted { get; set; }
    public bool WaterCompleted { get; set; }
    public bool SleepCompleted { get; set; }
    public bool NoSnack { get; set; }
    public string? Notes { get; set; }
}
