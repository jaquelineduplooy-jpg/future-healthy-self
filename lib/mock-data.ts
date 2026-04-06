import type { Recipe, Ingredient, MealPlan, MealPlanSlot, Workout, HealthLog, DailyLog } from '@/types/database'

// ── RECIPES (subset of the 114 from Recipe Database V1) ──────────────────────
export const MOCK_RECIPES: Recipe[] = [
  // Brunch
  { id: 'r-001', name: 'Benchmark Omelette',              category: 'Brunch', source: 'Real Meal Revolution',    servings: 2, prep_time_mins: 5,  cook_time_mins: 10, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-002', name: 'Avo & Raspberry Shake',           category: 'Brunch', source: 'Real Meal Revolution',    servings: 1, prep_time_mins: 5,  cook_time_mins: 0,  screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-003', name: 'Bacon, Asparagus & Soft-Boiled Eggs', category: 'Brunch', source: 'Real Meal Revolution', servings: 2, prep_time_mins: 10, cook_time_mins: 15, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-004', name: 'Egg Muffins',                     category: 'Brunch', source: 'Pinterest',               servings: 6, prep_time_mins: 10, cook_time_mins: 20, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-005', name: 'Chia Pudding',                    category: 'Brunch', source: 'Pinterest',               servings: 2, prep_time_mins: 5,  cook_time_mins: 0,  screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-006', name: 'Kale w/ Chorizo & Eggs',          category: 'Brunch', source: 'Real Meal Revolution',    servings: 2, prep_time_mins: 5,  cook_time_mins: 15, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  // Mains
  { id: 'r-007', name: 'Creamy Butter Chicken Curry',     category: 'Main',   source: 'Real Meal Revolution',    servings: 4, prep_time_mins: 15, cook_time_mins: 35, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-008', name: 'Roast Chicken',                   category: 'Main',   source: 'Real Meal Revolution',    servings: 4, prep_time_mins: 15, cook_time_mins: 90, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-009', name: 'Grilled Salmon w/ Caper Noisette',category: 'Main',   source: 'Real Meal Revolution',    servings: 2, prep_time_mins: 10, cook_time_mins: 15, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-010', name: 'Burrito Bowl',                    category: 'Main',   source: 'Pinterest',               servings: 2, prep_time_mins: 15, cook_time_mins: 20, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-011', name: 'Kofta w/ Tzatziki',               category: 'Main',   source: 'Real Meal Revolution',    servings: 4, prep_time_mins: 20, cook_time_mins: 15, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-012', name: 'Chermoula Chicken Kebabs',        category: 'Main',   source: 'Real Meal Revolution',    servings: 4, prep_time_mins: 20, cook_time_mins: 20, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-013', name: 'Crunchy Cabbage Salad w/ Red Curry', category: 'Main', source: 'Real Meal Revolution',   servings: 2, prep_time_mins: 15, cook_time_mins: 0,  screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-014', name: 'Lasagne',                         category: 'Main',   source: 'Real Meal Revolution',    servings: 6, prep_time_mins: 30, cook_time_mins: 45, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-015', name: 'Garlic Chicken Stir-fry',         category: 'Main',   source: 'Pinterest',               servings: 2, prep_time_mins: 10, cook_time_mins: 15, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  // Sides
  { id: 'r-016', name: 'Cauli-rice',                      category: 'Side',   source: 'Real Meal Revolution',    servings: 2, prep_time_mins: 5,  cook_time_mins: 10, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-017', name: '5-minute Soup',                   category: 'Side',   source: 'Glucose Goddess Method',  servings: 1, prep_time_mins: 2,  cook_time_mins: 5,  screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-018', name: 'Backwards Broccoli',              category: 'Side',   source: 'Glucose Goddess Method',  servings: 1, prep_time_mins: 5,  cook_time_mins: 15, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-019', name: 'Cauli-mash',                      category: 'Side',   source: 'Real Meal Revolution',    servings: 4, prep_time_mins: 10, cook_time_mins: 15, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
  { id: 'r-020', name: 'Flourless Lentil Bread',          category: 'Side',   source: 'Pinterest',               servings: 8, prep_time_mins: 15, cook_time_mins: 45, screenshot_url: null, ocr_confidence: null, is_user_uploaded: false, created_at: '2026-01-01', user_id: 'mock-user' },
]

// ── INGREDIENTS for key recipes ──────────────────────────────────────────────
export const MOCK_INGREDIENTS: Ingredient[] = [
  // Benchmark Omelette (r-001)
  { id: 'i-001', recipe_id: 'r-001', name: 'Eggs',            amount: 3,   unit: 'each', original_text: null, ocr_flagged: false },
  { id: 'i-002', recipe_id: 'r-001', name: 'Cheese (Grated)', amount: 40,  unit: 'g',    original_text: null, ocr_flagged: false },
  { id: 'i-003', recipe_id: 'r-001', name: 'Butter',          amount: 10,  unit: 'g',    original_text: null, ocr_flagged: false },
  // Creamy Butter Chicken Curry (r-007)
  { id: 'i-010', recipe_id: 'r-007', name: 'Chicken thighs',  amount: 600, unit: 'g',    original_text: null, ocr_flagged: false },
  { id: 'i-011', recipe_id: 'r-007', name: 'Coconut cream',   amount: 400, unit: 'ml',   original_text: null, ocr_flagged: false },
  { id: 'i-012', recipe_id: 'r-007', name: 'Butter',          amount: 30,  unit: 'g',    original_text: null, ocr_flagged: false },
  { id: 'i-013', recipe_id: 'r-007', name: 'Garlic (minced)', amount: 2,   unit: 'cloves',original_text: null, ocr_flagged: false },
  { id: 'i-014', recipe_id: 'r-007', name: 'Garam masala',    amount: 2,   unit: 'tsp',  original_text: null, ocr_flagged: false },
  // Crunchy Cabbage Salad (r-013)
  { id: 'i-020', recipe_id: 'r-013', name: 'White cabbage',   amount: 0.5, unit: 'each', original_text: null, ocr_flagged: false },
  { id: 'i-021', recipe_id: 'r-013', name: 'Lime',            amount: 1.5, unit: 'each', original_text: null, ocr_flagged: false },
  { id: 'i-022', recipe_id: 'r-013', name: 'Coconut cream',   amount: 150, unit: 'ml',   original_text: null, ocr_flagged: false },
  { id: 'i-023', recipe_id: 'r-013', name: 'Red Thai curry paste', amount: 1, unit: 'tsp', original_text: null, ocr_flagged: false },
  { id: 'i-024', recipe_id: 'r-013', name: 'Fresh coriander', amount: 1,   unit: 'bunch',original_text: null, ocr_flagged: false },
  { id: 'i-025', recipe_id: 'r-013', name: 'Bean sprouts',    amount: 1.5, unit: 'cups', original_text: null, ocr_flagged: false },
]

// ── MEAL PLAN ─────────────────────────────────────────────────────────────────
export const MOCK_MEAL_PLAN: MealPlan = {
  id: 'mp-001',
  user_id: 'mock-user',
  name: 'Week of Apr 7',
  week_start: '2026-04-07',
  people_count: 2,
  daily_calorie_target: 1600,
}

export const MOCK_SLOTS: MealPlanSlot[] = [
  // Tuesday (today in the demo)
  { id: 's-001', meal_plan_id: 'mp-001', day_of_week: 'Tue', meal_type: 'Brunch', recipe_id: 'r-001', is_leftover: false },
  { id: 's-002', meal_plan_id: 'mp-001', day_of_week: 'Tue', meal_type: 'Main',   recipe_id: 'r-007', is_leftover: false },
  { id: 's-003', meal_plan_id: 'mp-001', day_of_week: 'Tue', meal_type: 'Side',   recipe_id: 'r-013', is_leftover: false },
  // Monday
  { id: 's-004', meal_plan_id: 'mp-001', day_of_week: 'Mon', meal_type: 'Brunch', recipe_id: 'r-006', is_leftover: false },
  { id: 's-005', meal_plan_id: 'mp-001', day_of_week: 'Mon', meal_type: 'Main',   recipe_id: 'r-008', is_leftover: false },
  { id: 's-006', meal_plan_id: 'mp-001', day_of_week: 'Mon', meal_type: 'Side',   recipe_id: 'r-016', is_leftover: false },
  // Wednesday
  { id: 's-007', meal_plan_id: 'mp-001', day_of_week: 'Wed', meal_type: 'Main',   recipe_id: null,    is_leftover: true  },
  // Thursday
  { id: 's-008', meal_plan_id: 'mp-001', day_of_week: 'Thu', meal_type: 'Main',   recipe_id: 'r-011', is_leftover: false },
  { id: 's-009', meal_plan_id: 'mp-001', day_of_week: 'Thu', meal_type: 'Side',   recipe_id: 'r-018', is_leftover: false },
  // Friday
  { id: 's-010', meal_plan_id: 'mp-001', day_of_week: 'Fri', meal_type: 'Brunch', recipe_id: 'r-003', is_leftover: false },
  { id: 's-011', meal_plan_id: 'mp-001', day_of_week: 'Fri', meal_type: 'Main',   recipe_id: 'r-009', is_leftover: false },
]

// ── WORKOUTS ──────────────────────────────────────────────────────────────────
export const MOCK_WORKOUTS: Workout[] = [
  { id: 'w-001', user_id: 'mock-user', name: 'Morning Walk',      type: 'Walking',  scheduled_date: '2026-04-07', start_time: '06:00', duration_mins: 45, intensity: 'Low',    status: 'Done',    est_calories_burned: 180, actual_calories_burned: 175, notes: 'Fasted morning walk', gcal_event_id: null, gcal_synced: false },
  { id: 'w-002', user_id: 'mock-user', name: 'HIIT Session',      type: 'HIIT',     scheduled_date: '2026-04-08', start_time: '12:30', duration_mins: 30, intensity: 'High',   status: 'Done',    est_calories_burned: 320, actual_calories_burned: 310, notes: 'Tabata — 20s on 10s off × 8', gcal_event_id: null, gcal_synced: false },
  { id: 'w-003', user_id: 'mock-user', name: 'Rest Day',          type: 'Stretching',scheduled_date: '2026-04-09', start_time: null,    duration_mins: 20, intensity: 'Low',    status: 'Rest Day',est_calories_burned: 0,   actual_calories_burned: null, notes: 'Active recovery', gcal_event_id: null, gcal_synced: false },
  { id: 'w-004', user_id: 'mock-user', name: 'Strength Training', type: 'Strength', scheduled_date: '2026-04-10', start_time: '07:00', duration_mins: 50, intensity: 'High',   status: 'Planned', est_calories_burned: 280, actual_calories_burned: null, notes: 'Upper body — push/pull superset', gcal_event_id: null, gcal_synced: false },
  { id: 'w-005', user_id: 'mock-user', name: 'Yoga Flow',         type: 'Yoga',     scheduled_date: '2026-04-11', start_time: '07:30', duration_mins: 45, intensity: 'Low',    status: 'Planned', est_calories_burned: 150, actual_calories_burned: null, notes: 'Vinyasa flow', gcal_event_id: null, gcal_synced: false },
  { id: 'w-006', user_id: 'mock-user', name: 'Long Run',          type: 'Running',  scheduled_date: '2026-04-12', start_time: '08:00', duration_mins: 40, intensity: 'Medium', status: 'Planned', est_calories_burned: 380, actual_calories_burned: null, notes: 'Easy 5km — Zone 2', gcal_event_id: null, gcal_synced: false },
  { id: 'w-007', user_id: 'mock-user', name: 'Rest Day',          type: 'Other',    scheduled_date: '2026-04-13', start_time: null,    duration_mins: 0,  intensity: 'Low',    status: 'Rest Day',est_calories_burned: 0,   actual_calories_burned: null, notes: 'Meal prep day', gcal_event_id: null, gcal_synced: false },
]

// ── HEALTH LOGS (last 7 days for dashboard) ───────────────────────────────────
export const MOCK_HEALTH_LOGS: HealthLog[] = [
  { id: 'h-001', user_id: 'mock-user', log_date: '2026-04-02', water_ml: 1750, weight_kg: 72.4, exercise_type: 'Running',  exercise_duration_mins: 30, exercise_intensity: 'Medium', mood_score: 4, energy_score: 4, journal_note: null },
  { id: 'h-002', user_id: 'mock-user', log_date: '2026-04-03', water_ml: 1500, weight_kg: 72.2, exercise_type: null,       exercise_duration_mins: null, exercise_intensity: null,   mood_score: 3, energy_score: 3, journal_note: null },
  { id: 'h-003', user_id: 'mock-user', log_date: '2026-04-04', water_ml: 2000, weight_kg: 72.0, exercise_type: 'Strength', exercise_duration_mins: 45, exercise_intensity: 'High',   mood_score: 5, energy_score: 5, journal_note: 'Great session!' },
  { id: 'h-004', user_id: 'mock-user', log_date: '2026-04-05', water_ml: 1250, weight_kg: 72.1, exercise_type: null,       exercise_duration_mins: null, exercise_intensity: null,   mood_score: 3, energy_score: 2, journal_note: null },
  { id: 'h-005', user_id: 'mock-user', log_date: '2026-04-06', water_ml: 1800, weight_kg: 71.9, exercise_type: 'Walking',  exercise_duration_mins: 45, exercise_intensity: 'Low',    mood_score: 4, energy_score: 4, journal_note: null },
  { id: 'h-006', user_id: 'mock-user', log_date: '2026-04-07', water_ml: 1750, weight_kg: 71.9, exercise_type: 'Walking',  exercise_duration_mins: 45, exercise_intensity: 'Low',    mood_score: 4, energy_score: 3, journal_note: null },
  { id: 'h-007', user_id: 'mock-user', log_date: '2026-04-08', water_ml: 1500, weight_kg: 71.8, exercise_type: 'HIIT',     exercise_duration_mins: 30, exercise_intensity: 'High',   mood_score: 4, energy_score: 4, journal_note: null },
]

// ── DAILY LOGS ────────────────────────────────────────────────────────────────
export const MOCK_DAILY_LOGS: DailyLog[] = [
  { id: 'd-001', user_id: 'mock-user', log_date: '2026-04-08', recipe_id: 'r-001', meal_type: 'Brunch', portion_multiplier: 1.0, eaten_at: '2026-04-08T08:15:00Z', was_planned: true },
  { id: 'd-002', user_id: 'mock-user', log_date: '2026-04-08', recipe_id: 'r-007', meal_type: 'Main',   portion_multiplier: 1.0, eaten_at: '2026-04-08T13:00:00Z', was_planned: true },
]

// ── MACRO ESTIMATES (kcal / protein / fat / carbs per serving) ────────────────
export const MACRO_ESTIMATES: Record<string, { kcal: number; protein: number; fat: number; carbs: number }> = {
  'r-001': { kcal: 420, protein: 28, fat: 32, carbs: 4  },
  'r-002': { kcal: 350, protein: 6,  fat: 28, carbs: 12 },
  'r-003': { kcal: 480, protein: 36, fat: 34, carbs: 3  },
  'r-004': { kcal: 180, protein: 14, fat: 12, carbs: 2  },
  'r-005': { kcal: 280, protein: 8,  fat: 18, carbs: 20 },
  'r-006': { kcal: 520, protein: 32, fat: 38, carbs: 6  },
  'r-007': { kcal: 680, protein: 44, fat: 48, carbs: 12 },
  'r-008': { kcal: 420, protein: 38, fat: 28, carbs: 2  },
  'r-009': { kcal: 380, protein: 34, fat: 26, carbs: 4  },
  'r-010': { kcal: 520, protein: 28, fat: 18, carbs: 42 },
  'r-011': { kcal: 460, protein: 36, fat: 32, carbs: 8  },
  'r-012': { kcal: 380, protein: 38, fat: 18, carbs: 10 },
  'r-013': { kcal: 310, protein: 8,  fat: 22, carbs: 18 },
  'r-014': { kcal: 580, protein: 32, fat: 38, carbs: 18 },
  'r-015': { kcal: 340, protein: 32, fat: 18, carbs: 8  },
  'r-016': { kcal: 80,  protein: 4,  fat: 4,  carbs: 8  },
  'r-017': { kcal: 120, protein: 8,  fat: 4,  carbs: 10 },
  'r-018': { kcal: 90,  protein: 5,  fat: 4,  carbs: 8  },
  'r-019': { kcal: 110, protein: 4,  fat: 6,  carbs: 8  },
  'r-020': { kcal: 160, protein: 8,  fat: 4,  carbs: 22 },
}
