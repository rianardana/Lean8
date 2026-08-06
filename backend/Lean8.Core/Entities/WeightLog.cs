namespace Lean8.Core.Entities;

public class WeightLog
{
    public int Id { get; set; }
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public double Weight { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
