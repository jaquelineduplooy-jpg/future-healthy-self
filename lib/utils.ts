/**
 * Pure client-safe utility functions.
 * No 'use server' — these run anywhere: browser, server, or edge.
 * This is the single source of truth for utilities previously split
 * across lib/units.ts (now merged here to avoid missing module errors).
 */

import { MACRO_ESTIMATES } from '@/lib/mock-data'
import type { DailyLog } from '@/types/database'

// ── MACROS ────────────────────────────────────────────────────────────────────

export function getMacros(recipeId: string) {
  return MACRO_ESTIMATES[recipeId] ?? { kcal: 0, protein: 0, fat: 0, carbs: 0 }
}

export function calcDayTotals(logs: DailyLog[]) {
  return logs.reduce(
    (acc, log) => {
      const m    = getMacros(log.recipe_id ?? '')
      const mult = log.portion_multiplier
      return {
        kcal:    acc.kcal    + m.kcal    * mult,
        protein: acc.protein + m.protein * mult,
        fat:     acc.fat     + m.fat     * mult,
        carbs:   acc.carbs   + m.carbs   * mult,
      }
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  )
}

// ── UNITS ─────────────────────────────────────────────────────────────────────

export type CanonicalUnit =
  | 'cup' | 'tbsp' | 'tsp' | 'g' | 'kg' | 'ml' | 'L'
  | 'each' | 'bunch' | 'cloves' | 'shot' | 'pinch'
  | 'cm' | 'racks' | 'heads'

const UNIT_SYNONYMS: Record<string, CanonicalUnit> = {
  tablespoon: 'tbsp', tablespoons: 'tbsp', T: 'tbsp',
  teaspoon: 'tsp',   teaspoons: 'tsp',    t: 'tsp',
  gram: 'g',         grams: 'g',
  kilogram: 'kg',    kilograms: 'kg',     kilo: 'kg',
  millilitre: 'ml',  milliliter: 'ml',    mL: 'ml',
  litre: 'L',        liter: 'L',
  piece: 'each',     pieces: 'each',      item: 'each',
  cups: 'cup',
}

const CANONICAL = new Set<string>([
  'cup','tbsp','tsp','g','kg','ml','L',
  'each','bunch','cloves','shot','pinch','cm','racks','heads',
])

export function normaliseUnit(raw: string): { unit: string; flagged: boolean } {
  const trimmed = raw?.trim() ?? ''
  if (UNIT_SYNONYMS[trimmed])        return { unit: UNIT_SYNONYMS[trimmed], flagged: false }
  if (UNIT_SYNONYMS[trimmed.toLowerCase()]) return { unit: UNIT_SYNONYMS[trimmed.toLowerCase()], flagged: false }
  if (CANONICAL.has(trimmed))        return { unit: trimmed, flagged: false }
  return { unit: trimmed, flagged: true }
}

export function parseAmount(raw: string): number {
  // Unicode fractions
  const unicode: Record<string, number> = {
    '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667,
  }
  let s = raw.trim()
  for (const [k, v] of Object.entries(unicode)) {
    s = s.replace(k, ` ${v}`)
  }
  // Range: "2-3" or "2–3" → average
  const range = s.match(/^(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)$/)
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2
  // Fraction: "1/2"
  const frac  = s.match(/^(\d+)\/(\d+)$/)
  if (frac)   return parseFloat(frac[1]) / parseFloat(frac[2])
  // Mixed number: "2 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed)  return parseFloat(mixed[1]) + parseFloat(mixed[2]) / parseFloat(mixed[3])
  return parseFloat(s) || 0
}

export function scaleAmount(amount: number, servingsBase: number, people: number): number {
  return Math.round((amount * people / servingsBase) * 100) / 100
}

export function formatAmount(amount: number, unit: string | null): string {
  if (!unit) return String(Math.round(amount * 100) / 100)
  if (amount === 0.5)  return `½ ${unit}`
  if (amount === 0.25) return `¼ ${unit}`
  if (amount === 0.75) return `¾ ${unit}`
  return `${Math.round(amount * 100) / 100} ${unit}`
}
