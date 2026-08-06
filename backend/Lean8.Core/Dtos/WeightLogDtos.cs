namespace Lean8.Core.Dtos;

public class WeightLogDto
{
    public int Id { get; set; }
    public string Date { get; set; } = string.Empty;
    public double Weight { get; set; }
}

public class CreateWeightLogDto
{
    public string? Date { get; set; } // Optional, defaults to today YYYY-MM-DD
    public double Weight { get; set; }
}
