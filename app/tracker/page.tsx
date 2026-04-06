'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { getDailyLogs, getTodayHealthLog, logMealEaten, removeMealLog, upsertHealthLog, getActiveMealPlan,  } from '@/lib/data'
import type { DailyLog, HealthLog, MealPlanWithSlots } from '@/types/database'
import { format } from 'date-fns'
import { getMacros, calcDayTotals } from '@/lib/utils'

const MOODS = ['😞', '😕', '😐', '🙂', '😄']
const TODAY = format(new Date(), 'yyyy-MM-dd')

export default function TrackerPage() {
  const { user } = useAuth()
  const [plan, setPlan]         = useState<MealPlanWithSlots | null>(null)
  const [logs, setLogs]         = useState<DailyLog[]>([])
  const [health, setHealth]     = useState<HealthLog | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const [planData, logsData, healthData] = await Promise.all([
      getActiveMealPlan(user.id),
      getDailyLogs(user.id, TODAY),
      getTodayHealthLog(user.id, TODAY),
    ])
    setPlan(planData)
    setLogs(logsData)
    setHealth(healthData)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Toggle a meal as eaten / un-eaten
  const toggleMeal = async (recipeId: string, mealType: string, recipeName: string) => {
    if (!user) return
    setSaving(recipeId)
    const existingLog = logs.find(l => l.recipe_id === recipeId && l.log_date === TODAY)
    if (existingLog) {
      await removeMealLog(existingLog.id)
      setLogs(prev => prev.filter(l => l.id !== existingLog.id))
    } else {
      await logMealEaten(user.id, recipeId, mealType, TODAY)
      setLogs(prev => [...prev, {
        id: `temp-${Date.now()}`, user_id: user.id, log_date: TODAY,
        recipe_id: recipeId, meal_type: mealType, portion_multiplier: 1.0,
        eaten_at: new Date().toISOString(), was_planned: true,
      }])
    }
    setSaving(null)
  }

  // Update water (each drop = 250ml)
  const setWater = async (drops: number) => {
    if (!user) return
    const ml = drops * 250
    setHealth(prev => ({ ...(prev ?? {} as HealthLog), water_ml: ml }))
    await upsertHealthLog(user.id, TODAY, { water_ml: ml })
  }

  // Update mood
  const setMood = async (score: number) => {
    if (!user) return
    setHealth(prev => ({ ...(prev ?? {} as HealthLog), mood_score: score }))
    await upsertHealthLog(user.id, TODAY, { mood_score: score })
  }

  const waterDrops  = Math.round((health?.water_ml ?? 0) / 250)
  const waterTarget = 8
  const totals      = calcDayTotals(logs)
  const calTarget   = plan?.daily_calorie_target ?? 1600

  // Today's planned slots
  const todayDay = format(new Date(), 'EEE') as any
  const todaySlots = plan?.slots.filter(s => s.day_of_week === todayDay) ?? []

  if (loading) return (
    <div className="flex-1 flex items-center justify-center h-screen bg-white">
      <div className="w-8 h-8 rounded-full border-4 border-berry border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-berry px-5 pt-14 pb-3 flex justify-between items-center">
        <span className="text-white text-sm font-semibold">9:41</span>
        <span className="text-white text-xs">●●●</span>
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">Today · {format(new Date(), 'EEE d MMM')}</h1>
        <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg">⋯</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Calorie + Protein grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-berry-light rounded-[14px] p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-berry mb-2">Calories</div>
            <div className="text-2xl font-semibold text-berry">{Math.round(totals.kcal).toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-0.5">of {calTarget.toLocaleString()} kcal</div>
            <div className="h-1.5 bg-berry/15 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-berry rounded-full transition-all" style={{ width: `${Math.min(Math.round(totals.kcal/calTarget*100), 100)}%` }} />
            </div>
          </div>
          <div className="bg-olive-light rounded-[14px] p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-olive-dark mb-2">Protein</div>
            <div className="text-2xl font-semibold text-olive-dark">{Math.round(totals.protein)}g</div>
            <div className="text-xs text-gray-500 mt-0.5">of 100g target</div>
            <div className="h-1.5 bg-olive/20 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-olive rounded-full transition-all" style={{ width: `${Math.min(Math.round(totals.protein), 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Water */}
        <div className="bg-white border border-gray-100 rounded-[14px] p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-800">Water intake</span>
            <span className="chip chip-mint text-xs">{(waterDrops * 0.25).toFixed(2).replace(/\.?0+$/, '')}L / 2L</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: waterTarget }).map((_, i) => (
              <button key={i} onClick={() => setWater(i < waterDrops ? i : i + 1)}
                className="w-8 h-9 flex items-center justify-center">
                <svg viewBox="0 0 24 30" width="28" height="32" fill="none">
                  <path d="M12 2C12 2 3 12 3 18a9 9 0 0018 0c0-6-9-16-9-16z" fill={i < waterDrops ? '#3a9e7a' : '#e5e7eb'}/>
                </svg>
              </button>
            ))}
          </div>
          <button onClick={() => setWater(Math.min(waterDrops + 1, waterTarget))}
            className="mt-3 w-full py-2 rounded-full border border-mint-dark text-mint-dark text-sm font-semibold bg-transparent">
            + Add 250ml
          </button>
        </div>

        {/* Mood */}
        <div className="bg-white border border-gray-100 rounded-[14px] p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-800">How are you feeling?</span>
          </div>
          <div className="flex justify-between">
            {MOODS.map((emoji, i) => (
              <button key={i} onClick={() => setMood(i + 1)}
                className={[
                  'w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all border-2',
                  health?.mood_score === i + 1 ? 'border-berry bg-berry-light' : 'border-transparent'
                ].join(' ')}>
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Meals today */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-2 mb-3">Meals today</div>
          {todaySlots.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No meals planned for today.</p>
          )}
          {todaySlots.map(slot => {
            if (!slot.recipe) return null
            const eaten = logs.some(l => l.recipe_id === slot.recipe_id)
            const macros = getMacros(slot.recipe_id!)
            const dotColor = slot.meal_type === 'Brunch' ? 'bg-berry' : slot.meal_type === 'Main' ? 'bg-orange' : 'bg-olive'
            return (
              <div key={slot.id} className="flex items-center gap-3 py-3 border-b border-gray-50">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                <span className="flex-1 text-sm text-gray-800 leading-snug">{slot.recipe.name}</span>
                <button
                  disabled={saving === slot.recipe_id}
                  onClick={() => toggleMeal(slot.recipe_id!, slot.meal_type, slot.recipe!.name)}
                  className={`chip text-xs font-semibold transition-all ${eaten ? 'chip-done' : 'chip-planned'} ${saving === slot.recipe_id ? 'opacity-50' : ''}`}>
                  {saving === slot.recipe_id ? '…' : eaten ? 'Eaten' : 'Planned'}
                </button>
                <span className="text-xs text-gray-400 ml-1">{macros.kcal} kcal</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
