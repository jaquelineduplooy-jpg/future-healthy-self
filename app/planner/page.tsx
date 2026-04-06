'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { getActiveMealPlan, updateSlotRecipe } from '@/lib/data'
import type { MealPlanWithSlots, MealPlanSlotWithRecipe } from '@/types/database'
import { format, startOfWeek, addDays } from 'date-fns'
import { getMacros } from '@/lib/utils'

const DAYS: Array<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'> = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAY_LABELS = ['MON','TUE','WED','THU','FRI','SAT','SUN']

type SlotsByDay = Record<string, { Brunch?: MealPlanSlotWithRecipe; Main?: MealPlanSlotWithRecipe; Side?: MealPlanSlotWithRecipe }>

export default function PlannerPage() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<MealPlanWithSlots | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(1) // TUE index

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDates = DAYS.map((_, i) => addDays(weekStart, i))

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const data = await getActiveMealPlan(user.id)
    setPlan(data)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const slotsByDay: SlotsByDay = {}
  plan?.slots.forEach(slot => {
    if (!slotsByDay[slot.day_of_week]) slotsByDay[slot.day_of_week] = {}
    slotsByDay[slot.day_of_week][slot.meal_type] = slot
  })

  const activeSlots = slotsByDay[DAYS[activeDay]] ?? {}
  const activeMeals = ['Brunch', 'Main', 'Side'] as const

  const dayTotal = activeMeals.reduce((sum, type) => {
    const slot = activeSlots[type]
    if (!slot?.recipe_id) return sum
    return sum + getMacros(slot.recipe_id).kcal
  }, 0)

  const target = plan?.daily_calorie_target ?? 1600
  const pct = Math.min(Math.round((dayTotal / target) * 100), 100)

  const slotColors = { Brunch: { bg: '#f5e0f0', label: '#A72677' }, Main: { bg: '#fff0e8', label: '#b05010' }, Side: { bg: '#f0f3d0', label: '#6b7330' } }

  if (loading) return <LoadingScreen />

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Status bar */}
      <div className="bg-berry px-5 pt-14 pb-3 flex justify-between items-center">
        <span className="text-white text-sm font-semibold">9:41</span>
        <span className="text-white text-xs">●●●</span>
      </div>

      {/* Top nav */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">Weekly planner</h1>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
            Week
          </button>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-berry text-xl font-light">+</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Week header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <span className="chip chip-olive text-xs">
            {Math.round(
              DAYS.reduce((sum, day) => {
                const slots = slotsByDay[day] ?? {}
                return sum + activeMeals.reduce((s, t) => s + (slots[t]?.recipe_id ? getMacros(slots[t]!.recipe_id!).kcal : 0), 0)
              }, 0) / DAYS.length
            ).toLocaleString()} kcal avg
          </span>
        </div>

        {/* Day selector */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {DAYS.map((day, i) => {
            const hasSlots = Object.keys(slotsByDay[day] ?? {}).length > 0
            const isToday = format(weekDates[i], 'EEE') === format(today, 'EEE')
            return (
              <button key={day} onClick={() => setActiveDay(i)}
                className={[
                  'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border min-w-[46px] transition-all',
                  activeDay === i ? 'bg-berry border-berry' : hasSlots ? 'border-olive bg-white' : 'border-gray-100 bg-white',
                ].join(' ')}>
                <span className={`text-[10px] font-semibold ${activeDay === i ? 'text-white' : 'text-gray-400'}`}>{DAY_LABELS[i]}</span>
                <span className={`text-base font-semibold ${activeDay === i ? 'text-white' : 'text-gray-800'}`}>{weekDates[i].getDate()}</span>
                {hasSlots && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${activeDay === i ? 'bg-white/70' : 'bg-olive'}`} />}
                {isToday && !hasSlots && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${activeDay === i ? 'bg-white/50' : 'bg-berry/30'}`} />}
              </button>
            )
          })}
        </div>

        {/* Meal slots */}
        {activeMeals.map(type => {
          const slot = activeSlots[type]
          const recipe = slot?.recipe
          const macros = recipe ? getMacros(recipe.id) : null
          const colors = slotColors[type]
          return (
            <div key={type} className="rounded-[14px] p-3.5 mb-2.5" style={{ background: colors.bg }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: colors.label }}>{type}</div>
              {recipe ? (
                <>
                  <div className="text-[15px] font-semibold text-gray-900 mb-2 leading-snug">{recipe.name}</div>
                  <div className="flex gap-3">
                    <span className="text-xs text-gray-500">{macros?.kcal} kcal</span>
                    <span className="text-xs text-gray-500">{macros?.protein}g protein</span>
                    <span className="text-xs text-gray-500">{macros?.carbs}g carbs</span>
                  </div>
                </>
              ) : slot?.is_leftover ? (
                <div className="text-sm font-medium text-gray-600">Leftovers</div>
              ) : (
                <button className="text-sm text-gray-400 w-full text-left">Tap to add a recipe…</button>
              )}
            </div>
          )
        })}

        {/* Add slot */}
        <button className="w-full border-2 border-dashed border-gray-200 rounded-[14px] py-3 text-sm text-gray-400 mb-4">
          + Add meal slot
        </button>

        {/* Calorie bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Daily calories</span>
            <span className="font-semibold text-olive-dark">{dayTotal.toLocaleString()} / {target.toLocaleString()} kcal</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-olive transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {pct >= 100 && (
            <p className="text-xs text-orange-dark mt-1">At daily target — consider lighter options</p>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-berry px-5 pt-14 pb-3 flex justify-between items-center">
        <span className="text-white text-sm font-semibold">9:41</span>
        <span className="text-white text-xs">●●●</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-berry border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading your plan…</p>
        </div>
      </div>
    </div>
  )
}
