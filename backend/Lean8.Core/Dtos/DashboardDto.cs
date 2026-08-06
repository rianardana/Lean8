namespace Lean8.Core.Dtos;

public class DashboardDto
{
    public double CurrentWeight { get; set; }
    public double TargetWeight { get; set; }
    public double StartingWeight { get; set; }
    public double ProgressPercentage { get; set; }
    public int ActiveDays { get; set; }
    public string UserHandshakeName { get; set; } = string.Empty;
}
