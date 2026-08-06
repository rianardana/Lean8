# Multi-stage Dockerfile for ASP.NET Core 8 Web API on Railway
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["Lean8.Api/Lean8.Api.csproj", "Lean8.Api/"]
COPY ["Lean8.Core/Lean8.Core.csproj", "Lean8.Core/"]
COPY ["Lean8.Infrastructure/Lean8.Infrastructure.csproj", "Lean8.Infrastructure/"]
RUN dotnet restore "Lean8.Api/Lean8.Api.csproj"

# Copy source code and build in Release mode
COPY . .
WORKDIR "/src/Lean8.Api"
RUN dotnet build "Lean8.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Lean8.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Lean8.Api.dll"]
