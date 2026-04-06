-- ═══════════════════════════════════════════════════════════════════
-- Future Healthy Self — Complete Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── RECIPES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  category         TEXT CHECK (category IN ('Main','Side','Brunch')),
  source           TEXT,
  servings         INTEGER DEFAULT 1,
  prep_time_mins   INTEGER,
  cook_time_mins   INTEGER,
  screenshot_url   TEXT,
  ocr_confidence   FLOAT,
  is_user_uploaded BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS recipes_user_id_idx  ON recipes(user_id);
CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes(category);

-- ── INGREDIENTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID REFERENCES recipes(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  amount        NUMERIC,
  unit          TEXT,
  original_text TEXT,
  ocr_flagged   BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ingredients_recipe_id_idx ON ingredients(recipe_id);

-- ── MEAL PLANS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT,
  week_start           DATE NOT NULL,
  people_count         INTEGER DEFAULT 1 CHECK (people_count BETWEEN 1 AND 8),
  daily_calorie_target INTEGER DEFAULT 1600
);
CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx    ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS meal_plans_week_start_idx ON meal_plans(week_start);

-- ── MEAL PLAN SLOTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plan_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week  TEXT CHECK (day_of_week IN ('Mon','Tue','Wed','Thu','Fri','Sat','Sun')),
  meal_type    TEXT CHECK (meal_type IN ('Brunch','Main','Side')),
  recipe_id    UUID REFERENCES recipes(id) ON DELETE SET NULL,
  is_leftover  BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS meal_plan_slots_plan_idx ON meal_plan_slots(meal_plan_id);

-- ── DAILY LOGS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date            DATE NOT NULL,
  recipe_id           UUID REFERENCES recipes(id) ON DELETE SET NULL,
  meal_type           TEXT,
  portion_multiplier  NUMERIC DEFAULT 1.0,
  eaten_at            TIMESTAMPTZ,
  was_planned         BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx ON daily_logs(user_id, log_date);

-- ── HEALTH LOGS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date                DATE NOT NULL,
  water_ml                INTEGER,
  weight_kg               NUMERIC,
  exercise_type           TEXT,
  exercise_duration_mins  INTEGER,
  exercise_intensity      TEXT CHECK (exercise_intensity IN ('Low','Medium','High')),
  mood_score              INTEGER CHECK (mood_score BETWEEN 1 AND 5),
  energy_score            INTEGER CHECK (energy_score BETWEEN 1 AND 5),
  journal_note            TEXT,
  UNIQUE (user_id, log_date)  -- one row per user per day
);
CREATE INDEX IF NOT EXISTS health_logs_user_date_idx ON health_logs(user_id, log_date);

-- ── MEASUREMENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,
  waist_cm    NUMERIC,
  hips_cm     NUMERIC,
  chest_cm    NUMERIC,
  thighs_cm   NUMERIC,
  arms_cm     NUMERIC,
  UNIQUE (user_id, measured_at)
);

-- ── WORKOUTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workouts (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  type                   TEXT,
  scheduled_date         DATE,
  start_time             TIME,
  duration_mins          INTEGER,
  intensity              TEXT CHECK (intensity IN ('Low','Medium','High')),
  status                 TEXT CHECK (status IN ('Planned','Done','Skipped','Rest Day')) DEFAULT 'Planned',
  est_calories_burned    INTEGER,
  actual_calories_burned INTEGER,
  notes                  TEXT,
  gcal_event_id          TEXT,
  gcal_synced            BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS workouts_user_date_idx ON workouts(user_id, scheduled_date);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────
ALTER TABLE recipes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_recipes"    ON recipes         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_ings"       ON ingredients     FOR ALL USING (auth.uid() = (SELECT user_id FROM recipes WHERE id = recipe_id));
CREATE POLICY "own_plans"      ON meal_plans      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_slots"      ON meal_plan_slots FOR ALL USING (auth.uid() = (SELECT user_id FROM meal_plans WHERE id = meal_plan_id));
CREATE POLICY "own_daily"      ON daily_logs      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_health"     ON health_logs     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_measures"   ON measurements    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_workouts"   ON workouts        FOR ALL USING (auth.uid() = user_id);
