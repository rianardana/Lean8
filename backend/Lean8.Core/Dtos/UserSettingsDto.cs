namespace Lean8.Core.Dtos;

public class UserSettingsDto
{
    public string Name { get; set; } = string.Empty;
    public double HeightCm { get; set; }
    public double CurrentWeight { get; set; }
    public double TargetWeight { get; set; }
    public string? WorkoutTime { get; set; }
    public string? SleepTime { get; set; }
    public int ProteinTargetGrams { get; set; }
}
