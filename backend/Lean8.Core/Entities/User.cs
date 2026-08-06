namespace Lean8.Core.Entities;

public class User
{
    public int Id { get; set; } = 1;
    public string Name { get; set; } = "Lean8 User";
    public double HeightCm { get; set; } = 175;
    public double CurrentWeight { get; set; } = 86;
    public double TargetWeight { get; set; } = 65;
    public string? WorkoutTime { get; set; } = "07:00";
    public string? SleepTime { get; set; } = "22:00";
    public int ProteinTargetGrams { get; set; } = 120;
}
