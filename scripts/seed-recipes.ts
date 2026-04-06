/**
 * Seed script — imports all 114 recipes + ingredients from Recipe_Database_V1.xlsx
 *
 * Usage:
 *   1. Copy Recipe_Database_V1.xlsx into scripts/
 *   2. npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import ExcelJS from 'exceljs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const XLSX_PATH  = path.join(__dirname, 'Recipe_Database_V1.xlsx')
const USER_ID    = process.env.SEED_USER_ID ?? ''
const BATCH_SIZE = 20

const UNIT_MAP: Record<string, string> = {
  cups: 'cup', tablespoon: 'tbsp', tablespoons: 'tbsp', T: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', t: 'tsp',
  gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg', kilo: 'kg',
  millilitre: 'ml', milliliter: 'ml', mL: 'ml', litre: 'L', liter: 'L',
  piece: 'each', pieces: 'each', item: 'each',
}

function normaliseUnit(raw: string): string {
  return UNIT_MAP[raw?.trim()] ?? raw?.trim() ?? null
}

async function readSheet(wb: ExcelJS.Workbook, name: string) {
  const ws = wb.getWorksheet(name)
  if (!ws) throw new Error(`Sheet "${name}" not found`)
  const rows: Record<string, any>[] = []
  let headers: string[] = []
  ws.eachRow((row, i) => {
    if (i === 1) {
      headers = (row.values as any[]).slice(1).map(v => String(v ?? '').trim())
    } else {
      const obj: Record<string, any> = {}
      ;(row.values as any[]).slice(1).forEach((v, ci) => {
        if (headers[ci]) obj[headers[ci]] = v
      })
      rows.push(obj)
    }
  })
  return rows
}

async function seed() {
  if (!USER_ID) {
    console.error('❌  Set SEED_USER_ID in .env.local — get it from Supabase Auth dashboard')
    process.exit(1)
  }

  console.log('📖  Reading Recipe_Database_V1.xlsx …')
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(XLSX_PATH)

  const recipes = await readSheet(wb, 'Recipe Database')
  const ings    = await readSheet(wb, 'Ingredient Breakdown')
  console.log(`   Found ${recipes.length} recipes · ${ings.length} ingredients`)

  // ── Insert recipes in batches ──────────────────────────────────────────────
  const recipeRows = recipes
    .filter(r => r['Recipe Name'])
    .map(r => ({
      name:             String(r['Recipe Name']).trim(),
      category:         (['Main','Side','Brunch'].includes(r['Category'])
                          ? r['Category'] : 'Main') as 'Main'|'Side'|'Brunch',
      source:           r['Source'] ? String(r['Source']).trim() : null,
      servings:         parseInt(String(r['🍽️ Extras'] ?? '1').match(/\d+/)?.[0] ?? '1'),
      prep_time_mins:   null,
      cook_time_mins:   null,
      screenshot_url:   null,
      ocr_confidence:   null,
      is_user_uploaded: false,
      user_id:          USER_ID,
    }))

  console.log('\n📤  Inserting recipes …')
  const inserted: any[] = []
  for (let i = 0; i < recipeRows.length; i += BATCH_SIZE) {
    const batch = recipeRows.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase.from('recipes').insert(batch).select('id, name')
    if (error) { console.error(`  ❌  Batch ${i}:`, error.message); continue }
    inserted.push(...(data ?? []))
    process.stdout.write(`  ✓  ${Math.min(i + BATCH_SIZE, recipeRows.length)}/${recipeRows.length}\r`)
  }
  console.log(`\n  Done — ${inserted.length} recipes inserted`)

  // ── Build name → id map ────────────────────────────────────────────────────
  const nameToId = new Map(inserted.map(r => [r.name.toLowerCase().trim(), r.id]))

  // ── Insert ingredients in batches ──────────────────────────────────────────
  const ingRows = ings
    .filter(i => i['Recipe Name'] && i['Ingredient'])
    .map(i => {
      const recipeId = nameToId.get(String(i['Recipe Name']).toLowerCase().trim())
      if (!recipeId) return null
      return {
        recipe_id:     recipeId,
        name:          String(i['Ingredient']).trim(),
        amount:        parseFloat(String(i['Amount (Full Recipe)'] ?? '0')) || null,
        unit:          normaliseUnit(String(i['Unit'] ?? '')),
        original_text: null,
        ocr_flagged:   false,
      }
    })
    .filter(Boolean) as any[]

  console.log('\n📤  Inserting ingredients …')
  for (let i = 0; i < ingRows.length; i += 50) {
    const batch = ingRows.slice(i, i + 50)
    const { error } = await supabase.from('ingredients').insert(batch)
    if (error) { console.error(`  ❌  Ingredient batch ${i}:`, error.message); continue }
    process.stdout.write(`  ✓  ${Math.min(i + 50, ingRows.length)}/${ingRows.length}\r`)
  }

  console.log(`\n\n✅  Seed complete — ${inserted.length} recipes · ${ingRows.length} ingredients`)
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1) })
