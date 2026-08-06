# LEAN8.md

> Version: 0.1 MVP

## Vision

Lean8 adalah aplikasi personal untuk membantu satu pengguna membangun
konsistensi menuju tubuh lean melalui habit tracking sederhana dan
insight AI.

## Goal

-   Berat: 86 kg → 65 kg
-   Fokus: Konsisten, bukan sempurna.
-   Waktu input harian: \< 1 menit.

## Out of Scope

-   Multi-user
-   Social
-   Leaderboard
-   Payment
-   Marketplace
-   Kalori detail
-   Barcode makanan

## Tech Stack

-   Frontend: Next.js
-   UI: Tailwind CSS
-   Backend: ASP.NET Core 8 Web API
-   Database: SQLite (EF Core)
-   AI: OpenAI API
-   Deploy: Vercel + Railway (atau lokal saat MVP)

## Screens

### Dashboard

-   Berat sekarang
-   Target
-   Progress
-   Hari ke-

### Daily Check

Checklist: - Workout - Intermittent Fasting - Protein - Air Putih -
Tidur - No Snack

### Progress

Grafik berat badan.

### AI Review

Satu tombol: "Review Hari Ini"

AI memberikan maksimal 5 poin praktis berdasarkan data.

### Settings

-   Nama
-   Target berat
-   Jam latihan
-   Jam tidur
-   Target protein

## Database

### User

-   Id
-   Name
-   HeightCm
-   CurrentWeight
-   TargetWeight

### WeightLog

-   Id
-   Date
-   Weight

### DailyLog

-   Id
-   Date
-   Workout
-   IFCompleted
-   ProteinCompleted
-   WaterCompleted
-   SleepCompleted
-   NoSnack
-   Notes

## API

GET /dashboard GET /weights POST /weights GET /daily/{date} POST /daily
POST /ai/review

## AI Prompt

System: "Kamu adalah personal habit coach. Jangan memberi motivasi
kosong. Analisa data hari ini dan berikan maksimal lima saran praktis."

## Success Criteria

-   Input harian \< 60 detik
-   Dibuka setiap hari
-   Membantu mempertahankan konsistensi

## Future

-   Foto progres
-   Kalistenik tracker
-   Reminder
-   Identity Score
-   Audio afirmasi personal

## Gemini CLI Prompt

Read LEAN8.md carefully. Build exactly the application described. Do not
add unnecessary features. Keep UI minimal and responsive. Generate
production-ready code.
