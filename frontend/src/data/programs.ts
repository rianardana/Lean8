// Program workout "paket" — 5 paket × 2 varian (gym & calisthenics).
// Tiap varian = template 7 hari. "21 hari" = template ini diulang 3 minggu,
// dengan progresi (naik rep/beban) lewat `progression`.
// `exercises` berisi id dari WORKOUTS di ./workouts.

export type ProgramVariantType = "gym" | "calisthenics";

export interface ProgramDay {
  day: number; // 1-7
  rest?: boolean; // true = hari istirahat
  title: string;
  exercises: string[]; // id gerakan dari WORKOUTS
  note?: string;
}

export interface ProgramVariant {
  type: ProgramVariantType;
  days: ProgramDay[];
}

export interface Program {
  id: string;
  name: string;
  emoji: string;
  tagline: string; // copy singkat untuk image card
  progression: string; // cara naik intensitas antar minggu
  cover?: string; // path gambar card (opsional)
  variants: ProgramVariant[];
}

const rest = (day: number): ProgramDay => ({ day, rest: true, title: "Istirahat", exercises: [] });

export const PROGRAMS: Program[] = [
  // === 1. Lengan ===
  {
    id: "arms",
    name: "Paket Otot Lengan",
    emoji: "💪",
    tagline: "Biceps & triceps terbentuk dalam 21 hari",
    progression: "Minggu 1: 3 set · Minggu 2: 4 set · Minggu 3: tambah rep/beban",
    cover: "/Lengan.png",
    variants: [
      {
        type: "gym",
        days: [
          { day: 1, title: "Biceps & Triceps", exercises: ["bicep-curl", "triceps-pushdown"] },
          rest(2),
          { day: 3, title: "Biceps & Triceps", exercises: ["bicep-curl", "triceps-pushdown"] },
          rest(4),
          { day: 5, title: "Superset Lengan", exercises: ["bicep-curl", "triceps-pushdown"], note: "Superset: 2 gerakan back-to-back tanpa jeda." },
          rest(6),
          rest(7),
        ],
      },
      {
        type: "calisthenics",
        days: [
          { day: 1, title: "Chin Up & Dips", exercises: ["chin-up", "dips"] },
          rest(2),
          { day: 3, title: "Chin Up & Dips", exercises: ["chin-up", "dips"] },
          rest(4),
          { day: 5, title: "Superset Lengan", exercises: ["chin-up", "dips"], note: "Superset tanpa jeda." },
          rest(6),
          rest(7),
        ],
      },
    ],
  },

  // === 2. Core 21 hari ===
  {
    id: "core-21",
    name: "Target 21 Hari Perut Rata",
    emoji: "🔥",
    tagline: "Plank & core circuit, 21 hari berturut-turut",
    progression: "Tambah durasi plank & reps tiap minggu",
    cover: "/Perut%20Rata.png",
    variants: [
      {
        type: "gym",
        days: [
          { day: 1, title: "Core Sirkuit", exercises: ["plank", "leg-raise"], note: "Bisa ditambah beban (plate/medicine ball)." },
          { day: 2, title: "Core Sirkuit", exercises: ["hollow-hold", "mountain-climber"] },
          { day: 3, title: "Core Sirkuit", exercises: ["plank", "leg-raise", "hollow-hold"] },
          { day: 4, title: "Core Sirkuit", exercises: ["mountain-climber", "plank"] },
          { day: 5, title: "Core Sirkuit", exercises: ["leg-raise", "hollow-hold", "plank"] },
          { day: 6, title: "Core Sirkuit", exercises: ["plank", "mountain-climber"] },
          rest(7),
        ],
      },
      {
        type: "calisthenics",
        days: [
          { day: 1, title: "Core Sirkuit", exercises: ["plank", "leg-raise"] },
          { day: 2, title: "Core Sirkuit", exercises: ["hollow-hold", "mountain-climber"] },
          { day: 3, title: "Core Sirkuit", exercises: ["plank", "leg-raise", "hollow-hold"] },
          { day: 4, title: "Core Sirkuit", exercises: ["mountain-climber", "plank"] },
          { day: 5, title: "Core Sirkuit", exercises: ["leg-raise", "hollow-hold", "plank"] },
          { day: 6, title: "Core Sirkuit", exercises: ["plank", "mountain-climber"] },
          rest(7),
        ],
      },
    ],
  },

  // === 3. Dada & Bahu ===
  {
    id: "push",
    name: "Dada & Bahu",
    emoji: "🏋️",
    tagline: "Dorong: dada lebar, bahu kuat",
    progression: "Naik beban/rep tiap minggu",
    cover: "/Dada%20%26%20Bahu.png",
    variants: [
      {
        type: "gym",
        days: [
          { day: 1, title: "Push Day", exercises: ["bench-press", "ohp"] },
          rest(2),
          { day: 3, title: "Push Day", exercises: ["incline-db-press", "lateral-raise"] },
          rest(4),
          { day: 5, title: "Push Day", exercises: ["bench-press", "chest-fly", "lateral-raise"] },
          rest(6),
          rest(7),
        ],
      },
      {
        type: "calisthenics",
        days: [
          { day: 1, title: "Push Day", exercises: ["push-up", "pike-pushup"] },
          rest(2),
          { day: 3, title: "Push Day", exercises: ["push-up", "pike-pushup"] },
          rest(4),
          { day: 5, title: "Push Day", exercises: ["push-up", "pike-pushup"], note: "Tambah rep dari sesi sebelumnya." },
          rest(6),
          rest(7),
        ],
      },
    ],
  },

  // === 4. Punggung & Postur ===
  {
    id: "pull",
    name: "Punggung & Postur",
    emoji: "🧗",
    tagline: "Tegak, punggung kuat, bahu lebar",
    progression: "Naik beban/rep tiap minggu",
    cover: "/Pull%20Up.png",
    variants: [
      {
        type: "gym",
        days: [
          { day: 1, title: "Pull Day", exercises: ["lat-pulldown", "bent-over-row"] },
          rest(2),
          { day: 3, title: "Pull Day", exercises: ["deadlift", "lat-pulldown"] },
          rest(4),
          { day: 5, title: "Pull Day", exercises: ["bent-over-row", "deadlift"] },
          rest(6),
          rest(7),
        ],
      },
      {
        type: "calisthenics",
        days: [
          { day: 1, title: "Pull Day", exercises: ["pull-up", "inverted-row"] },
          rest(2),
          { day: 3, title: "Pull Day", exercises: ["inverted-row", "pull-up"] },
          rest(4),
          { day: 5, title: "Pull Day", exercises: ["pull-up", "inverted-row"] },
          rest(6),
          rest(7),
        ],
      },
    ],
  },

  // === 5. Kaki & Glute ===
  {
    id: "legs",
    name: "Kaki & Glute",
    emoji: "🦵",
    tagline: "Kaki kuat, glute kencang",
    progression: "Naik beban/rep tiap minggu",
    cover: "/Kaki%20%26%20Glutes.png",
    variants: [
      {
        type: "gym",
        days: [
          { day: 1, title: "Leg Day", exercises: ["squat", "romanian-deadlift"] },
          rest(2),
          { day: 3, title: "Leg Day", exercises: ["leg-press", "lunge"] },
          rest(4),
          { day: 5, title: "Leg Day", exercises: ["squat", "lunge", "romanian-deadlift"] },
          rest(6),
          rest(7),
        ],
      },
      {
        type: "calisthenics",
        days: [
          { day: 1, title: "Leg Day", exercises: ["bodyweight-squat", "glute-bridge"] },
          rest(2),
          { day: 3, title: "Leg Day", exercises: ["bulgarian-split-squat", "glute-bridge"] },
          rest(4),
          { day: 5, title: "Leg Day", exercises: ["bodyweight-squat", "bulgarian-split-squat"] },
          rest(6),
          rest(7),
        ],
      },
    ],
  },
];
