namespace Lean8.Core.Dtos;

public class AiReviewRequestDto
{
    public string? Date { get; set; } // Optional date to review, defaults to today
}

public class AiReviewResponseDto
{
    public string Date { get; set; } = string.Empty;
    public List<string> ActionablePoints { get; set; } = new();
    public string RawSummary { get; set; } = string.Empty;
}
