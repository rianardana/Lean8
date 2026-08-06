using Microsoft.AspNetCore.HttpOverrides;
using Lean8.Core.Interfaces;
using Lean8.Core.Services;
using Lean8.Infrastructure.Data;
using Lean8.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Railway Dynamic Port Binding
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://*:{port}");

// Environment & Configuration for PostgreSQL Connection String
var connectionString = GetPostgresConnectionString(builder.Configuration);

// Register Npgsql EF Core DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<ILean8Repository, Lean8Repository>();
builder.Services.AddHttpClient<IAiCoachService, AiCoachService>();

builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Forwarded Headers for Railway Reverse Proxy (SSL Termination)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Configure CORS for Vercel Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var rawOrigins = builder.Configuration["ALLOWED_ORIGINS"] 
            ?? Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");

        if (string.IsNullOrWhiteSpace(rawOrigins) || rawOrigins == "*")
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            var allowedOrigins = rawOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            policy.WithOrigins(allowedOrigins)
                  .SetIsOriginAllowedToAllowWildcardSubdomains()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

app.UseForwardedHeaders();

// Run EF Core Database Migrations on Startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();
}

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("EnableSwagger"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthorization();

// Expose Health Check Endpoint for Railway Health Probes
app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

// Helper method to parse standard or URI-based PostgreSQL connection strings
static string GetPostgresConnectionString(IConfiguration config)
{
    var connStr = Environment.GetEnvironmentVariable("DATABASE_URL") 
        ?? config.GetConnectionString("DefaultConnection") 
        ?? "Host=localhost;Database=lean8_db;Username=postgres;Password=postgres";

    if (connStr.StartsWith("postgres://") || connStr.StartsWith("postgresql://"))
    {
        var uri = new Uri(connStr);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo.Length > 0 ? userInfo[0] : "";
        var password = userInfo.Length > 1 ? userInfo[1] : "";
        var host = uri.Host;
        var reqPort = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={host};Port={reqPort};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
    }

    return connStr;
}
