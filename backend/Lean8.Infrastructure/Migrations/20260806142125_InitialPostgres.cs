using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Lean8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<string>(type: "text", nullable: false),
                    Workout = table.Column<bool>(type: "boolean", nullable: false),
                    IFCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    ProteinCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    WaterCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    SleepCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    NoSnack = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    HeightCm = table.Column<double>(type: "double precision", nullable: false),
                    CurrentWeight = table.Column<double>(type: "double precision", nullable: false),
                    TargetWeight = table.Column<double>(type: "double precision", nullable: false),
                    WorkoutTime = table.Column<string>(type: "text", nullable: true),
                    SleepTime = table.Column<string>(type: "text", nullable: true),
                    ProteinTargetGrams = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WeightLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<string>(type: "text", nullable: false),
                    Weight = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeightLogs", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CurrentWeight", "HeightCm", "Name", "ProteinTargetGrams", "SleepTime", "TargetWeight", "WorkoutTime" },
                values: new object[] { 1, 86.0, 175.0, "Lean8 User", 120, "22:00", 65.0, "07:00" });

            migrationBuilder.InsertData(
                table: "WeightLogs",
                columns: new[] { "Id", "CreatedAt", "Date", "Weight" },
                values: new object[] { 1, new DateTime(2026, 8, 6, 0, 0, 0, 0, DateTimeKind.Utc), "2026-08-06", 86.0 });

            migrationBuilder.CreateIndex(
                name: "IX_DailyLogs_Date",
                table: "DailyLogs",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WeightLogs_Date",
                table: "WeightLogs",
                column: "Date",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyLogs");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "WeightLogs");
        }
    }
}
