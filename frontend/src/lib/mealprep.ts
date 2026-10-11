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

const RICE = { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 } // per 100g
const VEGGIE_KCAL = 50

export interface DayPlan {
  source: ProteinSource
  sourceGramsPerMeal: number
  riceGramsPerMeal: number
  perMealProtein: number
  perMealKcal: number
}

export interface MealPrepPlan {
  mealsPerDay: number
  days: number
  target: { protein: number; kcal: number }
  rotation: DayPlan[] // panjang = days, bahan dirotasi round-robin
  weekly: { sourceGrams: Record<string, number>; riceGrams: number }
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
    const sourceGrams = Math.round((proteinPerMeal * 100) / source.protein)
    const sourceKcal = (sourceGrams * source.kcal) / 100
    const riceBudget = calorieTarget / mealsPerDay - sourceKcal - VEGGIE_KCAL
    const riceGrams = Math.max(0, Math.round((riceBudget * 100) / RICE.kcal))
    return {
      source,
      sourceGramsPerMeal: sourceGrams,
      riceGramsPerMeal: riceGrams,
      perMealProtein: Math.round(proteinPerMeal + (riceGrams * RICE.protein) / 100),
      perMealKcal: Math.round(sourceKcal + (riceGrams * RICE.kcal) / 100 + VEGGIE_KCAL),
    }
  })

  const sourceGrams: Record<string, number> = {}
  let riceGrams = 0
  for (const d of rotation) {
    sourceGrams[d.source.id] = (sourceGrams[d.source.id] ?? 0) + d.sourceGramsPerMeal * mealsPerDay
    riceGrams += d.riceGramsPerMeal * mealsPerDay
  }

  return { mealsPerDay, days, target: { protein: proteinTarget, kcal: calorieTarget }, rotation, weekly: { sourceGrams, riceGrams } }
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
