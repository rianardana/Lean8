using System.Text;
using System.Text.Json;
using Lean8.Core.Dtos;
using Lean8.Core.Entities;
using Lean8.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Lean8.Core.Services;

public class AiCoachService : IAiCoachService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AiCoachService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<AiReviewResponseDto> GenerateReviewAsync(
        User user, 
        DailyLog? todayLog, 
        List<DailyLog> recentLogs, 
        List<WeightLog> recentWeights)
    {
        var date = todayLog?.Date ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
        var apiKey = _configuration["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return GenerateFallbackReview(date, todayLog, user, recentWeights);
        }

        try
        {
            var promptData = BuildPromptContext(user, todayLog, recentLogs, recentWeights);

            var requestBody = new
            {
                model = _configuration["OpenAI:Model"] ?? "gpt-4o-mini",
                messages = new object[]
                {
                    new
                    {
                        role = "system",
                        content = "Kamu adalah personal habit coach. Jangan memberi motivasi kosong. Analisa data hari ini dan berikan maksimal lima saran praktis dalam format bullet point."
                    },
                    new
                    {
                        role = "user",
                        content = promptData
                    }
                },
                temperature = 0.5,
                max_tokens = 400
            };

            var requestJson = JsonSerializer.Serialize(requestBody);
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return GenerateFallbackReview(date, todayLog, user, recentWeights);
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);
            var content = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? string.Empty;

            var points = ParseBulletPoints(content);

            return new AiReviewResponseDto
            {
                Date = date,
                ActionablePoints = points,
                RawSummary = content
            };
        }
        catch
        {
            return GenerateFallbackReview(date, todayLog, user, recentWeights);
        }
    }

    private string BuildPromptContext(User user, DailyLog? todayLog, List<DailyLog> recentLogs, List<WeightLog> recentWeights)
    {
        var latestWeight = recentWeights.OrderByDescending(w => w.Date).FirstOrDefault()?.Weight ?? user.CurrentWeight;
        var sb = new StringBuilder();

        sb.AppendLine($"User Target: {user.CurrentWeight}kg -> {user.TargetWeight}kg (Saat ini: {latestWeight}kg)");
        sb.AppendLine($"Target Protein: {user.ProteinTargetGrams}g | Jam Tidur Target: {user.SleepTime}");
        sb.AppendLine();
        sb.AppendLine("Data Hari Ini:");

        if (todayLog == null)
        {
            sb.AppendLine("- User belum mengisi checklist hari ini.");
        }
        else
        {
            sb.AppendLine($"- Workout: {(todayLog.Workout ? "SELESAI" : "BELUM")}");
            sb.AppendLine($"- Intermittent Fasting: {(todayLog.IFCompleted ? "SELESAI" : "BELUM")}");
            sb.AppendLine($"- Protein: {(todayLog.ProteinCompleted ? "TERPENUHI" : "BELUM")}");
            sb.AppendLine($"- Air Putih: {(todayLog.WaterCompleted ? "TERPENUHI" : "BELUM")}");
            sb.AppendLine($"- Tidur Cukup: {(todayLog.SleepCompleted ? "SELESAI" : "BELUM")}");
            sb.AppendLine($"- No Snack: {(todayLog.NoSnack ? "YA (BERHASIL)" : "TIDAK (SNACKING)")}");
            if (!string.IsNullOrWhiteSpace(todayLog.Notes))
            {
                sb.AppendLine($"- Catatan: {todayLog.Notes}");
            }
        }

        sb.AppendLine();
        sb.AppendLine("Data 3 Hari Terakhir:");
        foreach (var log in recentLogs.Take(3))
        {
            sb.AppendLine($"- {log.Date}: Workout={log.Workout}, IF={log.IFCompleted}, Protein={log.ProteinCompleted}, Sleep={log.SleepCompleted}, NoSnack={log.NoSnack}");
        }

        return sb.ToString();
    }

    private AiReviewResponseDto GenerateFallbackReview(string date, DailyLog? todayLog, User user, List<WeightLog> recentWeights)
    {
        var points = new List<string>();

        if (todayLog == null)
        {
            points.Add("Isi checklist hari ini untuk melacak 6 habit dasar konsistensi Anda.");
            points.Add("Prioritaskan minum air 2-3 Liter dan tidur tepat waktu malam ini.");
            points.Add($"Pastikan asupan protein tercapai (~{user.ProteinTargetGrams}g) agar tidak gampang lapar.");
        }
        else
        {
            if (!todayLog.WaterCompleted)
                points.Add("Konsumsi air putih minimal 2.5L hari ini untuk mendukung hidrasi & metabolisme.");
            
            if (!todayLog.ProteinCompleted)
                points.Add($"Tingkatkan asupan protein (target {user.ProteinTargetGrams}g) pada makan berikutnya agar kenyang lebih lama.");

            if (!todayLog.NoSnack)
                points.Add("Hindari snacking di luar jam makan. Ganti cemilan dengan air putih atau teh tawar.");

            if (!todayLog.SleepCompleted)
                points.Add($"Matikan layar 30 menit sebelum jam tidur ({user.SleepTime}) untuk kualitas recovery yang maksimal.");

            if (!todayLog.Workout)
                points.Add("Lakukan jalan kaki ringan 15-20 menit atau latihan beban singkat untuk menjaga habit gerakan.");

            if (!todayLog.IFCompleted)
                points.Add("Patuhi jendela makan Intermittent Fasting esok hari, atur alarm jam mulai fasting.");

            if (points.Count == 0)
            {
                points.Add("Semua checklist habit hari ini terpenuhi dengan sempurna! Pertahankan rutinitas ini.");
                points.Add("Fokus pada istirahat yang berkualitas malam ini untuk recovery otot.");
                points.Add("Siapkan menu tinggi protein dan air putih untuk esok hari.");
            }
        }

        while (points.Count > 5)
        {
            points.RemoveAt(points.Count - 1);
        }

        return new AiReviewResponseDto
        {
            Date = date,
            ActionablePoints = points,
            RawSummary = string.Join("\n", points)
        };
    }

    private List<string> ParseBulletPoints(string rawText)
    {
        var lines = rawText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var result = new List<string>();

        foreach (var line in lines)
        {
            var trimmed = line.TrimStart('-', '*', '1', '2', '3', '4', '5', '.', ' ').Trim();
            if (!string.IsNullOrWhiteSpace(trimmed))
            {
                result.Add(trimmed);
            }
            if (result.Count == 5) break;
        }

        if (result.Count == 0 && !string.IsNullOrWhiteSpace(rawText))
        {
            result.Add(rawText.Trim());
        }

        return result;
    }
}
