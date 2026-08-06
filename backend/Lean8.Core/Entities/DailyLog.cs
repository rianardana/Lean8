namespace Lean8.Core.Entities;

public class DailyLog
{
    public int Id { get; set; }
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public bool Workout { get; set; }
    public bool IFCompleted { get; set; }
    public bool ProteinCompleted { get; set; }
    public bool WaterCompleted { get; set; }
    public bool SleepCompleted { get; set; }
    public bool NoSnack { get; set; }
    public string? Notes { get; set; }
}
