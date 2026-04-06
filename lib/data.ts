/**
 * Data access layer — v0.5.0
 *
 * Strategy: Always use mock data structure for meal plans and user data
 * (avoids auth/RLS/UUID issues during prototype testing), but load real
 * recipes from Supabase so all 114 recipes are available.
 *
 * NEXT_PUBLIC_USE_MOCK_DATA=true  → pure mock (no Supabase needed)
 * NEXT_PUBLIC_USE_MOCK_DATA=false → real Supabase for everything
 */

import {
  MOCK_RECIPES, MOCK_INGREDIENTS, MOCK_MEAL_PLAN, MOCK_SLOTS,
  MOCK_WORKOUTS, MOCK_HEALTH_LOGS, MOCK_DAILY_LOGS,
} from '@/lib/mock-data'
import type {
  Recipe, Ingredient, MealPlan, MealPlanSlot, Workout,
  HealthLog, DailyLog, RecipeWithIngredients, MealPlanWithSlots,
} from '@/types/database'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

// ── Supabase client (browser-safe, no next/headers) ──────────────────────────
async function getSupabase() {
  const { createClient } = await import('@/lib/supabase')
  return createClient()
}

// ── RECIPES ───────────────────────────────────────────────────────────────────
// Always try Supabase first for recipes — fallback to mock if it fails
export async function getRecipes(_userId: string): Promise<Recipe[]> {
  if (USE_MOCK) return MOCK_RECIPES
  try {
    const sb = await getSupabase()
    const { data, error } = await sb
      .from('recipes')
      .select('*')
      .order('name')
    if (error || !data?.length) return MOCK_RECIPES
    return data
  } catch {
    return MOCK_RECIPES
  }
}

export async function getRecipeWithIngredients(recipeId: string): Promise<RecipeWithIngredients | null> {
  if (USE_MOCK) {
    const recipe = MOCK_RECIPES.find(r => r.id === recipeId) ?? null
    if (!recipe) return null
    return { ...recipe, ingredients: MOCK_INGREDIENTS.filter(i => i.recipe_id === recipeId) }
  }
  try {
    const sb = await getSupabase()
    const { data } = await sb
      .from('recipes')
      .select('*, ingredients(*)')
      .eq('id', recipeId)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

export async function createRecipe(
  recipe: Omit<Recipe, 'id' | 'created_at'>,
  ingredients: Omit<Ingredient, 'id' | 'recipe_id'>[]
): Promise<Recipe | null> {
  const newRecipe: Recipe = { ...recipe, id: `r-${Date.now()}`, created_at: new Date().toISOString() }
  if (USE_MOCK) {
    MOCK_RECIPES.push(newRecipe)
    return newRecipe
  }
  try {
    const sb = await getSupabase()
    const { data } = await sb.from('recipes').insert(recipe).select().single()
    if (!data) return null
    if (ingredients.length > 0) {
      await sb.from('ingredients').insert(ingredients.map(i => ({ ...i, recipe_id: data.id })))
    }
    return data
  } catch {
    return null
  }
}

// ── MEAL PLANS ────────────────────────────────────────────────────────────────
// Always use mock meal plan structure — avoids UUID/auth issues
// Real recipes are injected into the slots from Supabase
export async function getActiveMealPlan(_userId: string): Promise<MealPlanWithSlots | null> {
  // Get real recipes to inject into slots
  let recipes = MOCK_RECIPES
  if (!USE_MOCK) {
    try {
      const sb = await getSupabase()
      const { data } = await sb.from('recipes').select('*').order('name')
      if (data?.length) recipes = data
    } catch {}
  }

  const slots = MOCK_SLOTS.map(slot => ({
    ...slot,
    recipe: recipes.find(r => r.id === slot.recipe_id) ?? null,
  }))
  return { ...MOCK_MEAL_PLAN, slots }
}

export async function updateSlotRecipe(slotId: string, recipeId: string | null): Promise<void> {
  const slot = MOCK_SLOTS.find(s => s.id === slotId)
  if (slot) slot.recipe_id = recipeId
}

export async function updateMealPlanPeople(_planId: string, peopleCount: number): Promise<void> {
  MOCK_MEAL_PLAN.people_count = peopleCount
}

// ── DAILY LOGS ────────────────────────────────────────────────────────────────
export async function getDailyLogs(_userId: string, date: string): Promise<DailyLog[]> {
  return MOCK_DAILY_LOGS.filter(l => l.log_date === date)
}

export async function logMealEaten(
  userId: string, recipeId: string, mealType: string,
  logDate: string, portionMultiplier = 1.0
): Promise<void> {
  MOCK_DAILY_LOGS.push({
    id: `d-${Date.now()}`, user_id: userId, log_date: logDate, recipe_id: recipeId,
    meal_type: mealType, portion_multiplier: portionMultiplier,
    eaten_at: new Date().toISOString(), was_planned: true,
  })
}

export async function removeMealLog(logId: string): Promise<void> {
  const idx = MOCK_DAILY_LOGS.findIndex(l => l.id === logId)
  if (idx !== -1) MOCK_DAILY_LOGS.splice(idx, 1)
}

// ── HEALTH LOGS ───────────────────────────────────────────────────────────────
export async function getTodayHealthLog(_userId: string, date: string): Promise<HealthLog | null> {
  return MOCK_HEALTH_LOGS.find(l => l.log_date === date) ?? null
}

export async function upsertHealthLog(
  userId: string, date: string,
  updates: Partial<Omit<HealthLog, 'id' | 'user_id' | 'log_date'>>
): Promise<void> {
  const existing = MOCK_HEALTH_LOGS.find(l => l.log_date === date)
  if (existing) Object.assign(existing, updates)
  else MOCK_HEALTH_LOGS.push({
    id: `h-${Date.now()}`, user_id: userId, log_date: date,
    water_ml: null, weight_kg: null, exercise_type: null,
    exercise_duration_mins: null, exercise_intensity: null,
    mood_score: null, energy_score: null, journal_note: null, ...updates
  })
}

export async function getHealthLogsRange(_userId: string, from: string, to: string): Promise<HealthLog[]> {
  return MOCK_HEALTH_LOGS.filter(l => l.log_date >= from && l.log_date <= to)
}

// ── WORKOUTS ──────────────────────────────────────────────────────────────────
export async function getWorkoutsForWeek(_userId: string, weekStart: string, weekEnd: string): Promise<Workout[]> {
  return MOCK_WORKOUTS.filter(w => w.scheduled_date && w.scheduled_date >= weekStart && w.scheduled_date <= weekEnd)
}

export async function updateWorkoutStatus(
  workoutId: string, status: Workout['status'], actualCalories?: number
): Promise<void> {
  const w = MOCK_WORKOUTS.find(w => w.id === workoutId)
  if (w) {
    w.status = status
    if (actualCalories !== undefined) w.actual_calories_burned = actualCalories
  }
}

export async function createWorkout(workout: Omit<Workout, 'id'>): Promise<Workout | null> {
  const newWorkout = { ...workout, id: `w-${Date.now()}` }
  MOCK_WORKOUTS.push(newWorkout)
  return newWorkout
}
