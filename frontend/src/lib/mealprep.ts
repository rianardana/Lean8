// Meal prep: hitung rotasi porsi bahan utama (berat matang) dari target protein & kalori.
// Makro per 100g = pendekatan nilai matang, bukan berat mentah/belanja.

export interface ProteinSource {
  id: string
  name: string
  protein: number // g / 100g
  kcal: number // kcal / 100g
  carbs: number // g / 100g
  fat: number // g / 100g
  unit?: string // e.g. 'butir'
  gramsPerUnit?: number
}

export const PROTEIN_SOURCES: ProteinSource[] = [
  { id: 'dada-ayam', name: 'Dada ayam panggang', protein: 31, kcal: 165, carbs: 0, fat: 3.6 },
  { id: 'telur', name: 'Telur rebus', protein: 12, kcal: 150, carbs: 1, fat: 11, unit: 'butir', gramsPerUnit: 50 },
  { id: 'tempe', name: 'Tempe kukus', protein: 19, kcal: 195, carbs: 9, fat: 11 },
  { id: 'ikan', name: 'Ikan bakar', protein: 25, kcal: 170, carbs: 0, fat: 7 },
  { id: 'daging', name: 'Daging sapi tanpa lemak', protein: 26, kcal: 180, carbs: 0, fat: 8 },
]

// Pelengkap: sayur & lemak — porsi tetap per makan, dirotasi round-robin.
export interface SideSource {
  id: string
  name: string
  portion: number // gram per makan
  kcal: number // kcal per porsi
  unit?: string // satuan belanja kalau bukan gram
  gramsPerUnit?: number
}

export const VEGGIE_SOURCES: SideSource[] = [
  { id: 'bayam', name: 'Bayam', portion: 150, kcal: 35 },
  { id: 'brokoli', name: 'Brokoli', portion: 150, kcal: 40 },
  { id: 'wortel', name: 'Wortel', portion: 120, kcal: 45 },
]

export const FAT_SOURCES: SideSource[] = [
  { id: 'minyak-zaitun', name: 'Minyak zaitun', portion: 15, kcal: 120, unit: 'sdm', gramsPerUnit: 15 },
  { id: 'alpukat', name: 'Alpukat', portion: 50, kcal: 80, unit: 'buah', gramsPerUnit: 50 },
  { id: 'almond', name: 'Almond', portion: 20, kcal: 115 },
]

const RICE = { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 } // per 100g

export interface DayPlan {
  source: ProteinSource
  veggie: SideSource
  fat: SideSource
  sourceGramsPerMeal: number
  veggieGramsPerMeal: number
  fatGramsPerMeal: number
  riceGramsPerMeal: number
  perMealProtein: number
  perMealKcal: number
}

export interface MealPrepPlan {
  mealsPerDay: number
  days: number
  target: { protein: number; kcal: number }
  rotation: DayPlan[] // panjang = days, bahan dirotasi round-robin
  weekly: {
    sourceGrams: Record<string, number>
    riceGrams: number
    veggieGrams: Record<string, number>
    fatGrams: Record<string, number>
  }
}

export function buildMealPrep(input: {
  proteinTarget: number
  calorieTarget: number
  mealsPerDay: number
  days: number
  sources: ProteinSource[]
}): MealPrepPlan {
  const { proteinTarget, calorieTarget, mealsPerDay, days, sources } = input
  const proteinPerMeal = proteinTarget / mealsPerDay

  const rotation: DayPlan[] = Array.from({ length: days }, (_, i) => {
    const source = sources[i % sources.length]
    const veggie = VEGGIE_SOURCES[i % VEGGIE_SOURCES.length]
    const fat = FAT_SOURCES[i % FAT_SOURCES.length]
    const sourceGrams = Math.round((proteinPerMeal * 100) / source.protein)
    const sourceKcal = (sourceGrams * source.kcal) / 100
    const riceBudget = calorieTarget / mealsPerDay - sourceKcal - veggie.kcal - fat.kcal
    const riceGrams = Math.max(0, Math.round((riceBudget * 100) / RICE.kcal))
    return {
      source,
      veggie,
      fat,
      sourceGramsPerMeal: sourceGrams,
      veggieGramsPerMeal: veggie.portion,
      fatGramsPerMeal: fat.portion,
      riceGramsPerMeal: riceGrams,
      perMealProtein: Math.round(proteinPerMeal + (riceGrams * RICE.protein) / 100),
      perMealKcal: Math.round(sourceKcal + (riceGrams * RICE.kcal) / 100 + veggie.kcal + fat.kcal),
    }
  })

  const sourceGrams: Record<string, number> = {}
  const veggieGrams: Record<string, number> = {}
  const fatGrams: Record<string, number> = {}
  let riceGrams = 0
  for (const d of rotation) {
    sourceGrams[d.source.id] = (sourceGrams[d.source.id] ?? 0) + d.sourceGramsPerMeal * mealsPerDay
    veggieGrams[d.veggie.id] = (veggieGrams[d.veggie.id] ?? 0) + d.veggieGramsPerMeal * mealsPerDay
    fatGrams[d.fat.id] = (fatGrams[d.fat.id] ?? 0) + d.fatGramsPerMeal * mealsPerDay
    riceGrams += d.riceGramsPerMeal * mealsPerDay
  }

  return { mealsPerDay, days, target: { protein: proteinTarget, kcal: calorieTarget }, rotation, weekly: { sourceGrams, riceGrams, veggieGrams, fatGrams } }
}

// Self-check: tiap hari harus nutup target protein.
export function demo(): void {
  const plan = buildMealPrep({ proteinTarget: 120, calorieTarget: 2000, mealsPerDay: 3, days: 7, sources: PROTEIN_SOURCES.slice(0, 2) })
  if (plan.rotation.length !== 7) throw new Error('mealprep: panjang rotasi salah')
  for (const d of plan.rotation) {
    if (d.perMealProtein * plan.mealsPerDay < 120) throw new Error('mealprep: protein di bawah target')
  }
  console.log('mealprep OK', plan.rotation, plan.weekly)
}
