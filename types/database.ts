export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          name: string
          category: 'Main' | 'Side' | 'Brunch'
          source: string | null
          servings: number
          prep_time_mins: number | null
          cook_time_mins: number | null
          screenshot_url: string | null
          ocr_confidence: number | null
          is_user_uploaded: boolean
          created_at: string
          user_id: string
        }
        Insert: Omit<Database['public']['Tables']['recipes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>
      }
      ingredients: {
        Row: {
          id: string
          recipe_id: string
          name: string
          amount: number | null
          unit: string | null
          original_text: string | null
          ocr_flagged: boolean
        }
        Insert: Omit<Database['public']['Tables']['ingredients']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['ingredients']['Insert']>
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          name: string | null
          week_start: string
          people_count: number
          daily_calorie_target: number
        }
        Insert: Omit<Database['public']['Tables']['meal_plans']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['meal_plans']['Insert']>
      }
      meal_plan_slots: {
        Row: {
          id: string
          meal_plan_id: string
          day_of_week: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
          meal_type: 'Brunch' | 'Main' | 'Side'
          recipe_id: string | null
          is_leftover: boolean
        }
        Insert: Omit<Database['public']['Tables']['meal_plan_slots']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['meal_plan_slots']['Insert']>
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          recipe_id: string | null
          meal_type: string | null
          portion_multiplier: number
          eaten_at: string | null
          was_planned: boolean
        }
        Insert: Omit<Database['public']['Tables']['daily_logs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['daily_logs']['Insert']>
      }
      health_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          water_ml: number | null
          weight_kg: number | null
          exercise_type: string | null
          exercise_duration_mins: number | null
          exercise_intensity: 'Low' | 'Medium' | 'High' | null
          mood_score: number | null
          energy_score: number | null
          journal_note: string | null
        }
        Insert: Omit<Database['public']['Tables']['health_logs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['health_logs']['Insert']>
      }
      measurements: {
        Row: {
          id: string
          user_id: string
          measured_at: string
          waist_cm: number | null
          hips_cm: number | null
          chest_cm: number | null
          thighs_cm: number | null
          arms_cm: number | null
        }
        Insert: Omit<Database['public']['Tables']['measurements']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['measurements']['Insert']>
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string | null
          scheduled_date: string | null
          start_time: string | null
          duration_mins: number | null
          intensity: 'Low' | 'Medium' | 'High' | null
          status: 'Planned' | 'Done' | 'Skipped' | 'Rest Day'
          est_calories_burned: number | null
          actual_calories_burned: number | null
          notes: string | null
          gcal_event_id: string | null
          gcal_synced: boolean
        }
        Insert: Omit<Database['public']['Tables']['workouts']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>
      }
    }
  }
}

// Convenience types
export type Recipe       = Database['public']['Tables']['recipes']['Row']
export type Ingredient   = Database['public']['Tables']['ingredients']['Row']
export type MealPlan     = Database['public']['Tables']['meal_plans']['Row']
export type MealPlanSlot = Database['public']['Tables']['meal_plan_slots']['Row']
export type DailyLog     = Database['public']['Tables']['daily_logs']['Row']
export type HealthLog    = Database['public']['Tables']['health_logs']['Row']
export type Measurement  = Database['public']['Tables']['measurements']['Row']
export type Workout      = Database['public']['Tables']['workouts']['Row']

// Enriched types used in UI
export type RecipeWithIngredients = Recipe & { ingredients: Ingredient[] }
export type MealPlanSlotWithRecipe = MealPlanSlot & { recipe: Recipe | null }
export type MealPlanWithSlots = MealPlan & { slots: MealPlanSlotWithRecipe[] }
