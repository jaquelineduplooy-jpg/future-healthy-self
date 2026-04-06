'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { getActiveMealPlan, getRecipes, updateSlotRecipe } from '@/lib/data'
import type { MealPlanWithSlots, MealPlanSlotWithRecipe, Recipe } from '@/types/database'
import { format, startOfWeek, addDays } from 'date-fns'
import { getMacros } from '@/lib/utils'

const DAYS: Array<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'> = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAY_LABELS = ['MON','TUE','WED','THU','FRI','SAT','SUN']
type MealType = 'Brunch' | 'Main' | 'Side'
type SlotsByDay = Record<string, { Brunch?: MealPlanSlotWithRecipe; Main?: MealPlanSlotWithRecipe; Side?: MealPlanSlotWithRecipe }>

const SLOT_COLORS = {
  Brunch: { bg: '#f5e0f0', label: '#A72677' },
  Main:   { bg: '#fff0e8', label: '#b05010' },
  Side:   { bg: '#f0f3d0', label: '#6b7330' },
}

const CAT_COLOR: Record<string, string> = {
  Brunch: '#A72677', Main: '#FF9759', Side: '#BAC35A',
}

export default function PlannerPage() {
  const { user } = useAuth()
  const [plan, setPlan]       = useState<MealPlanWithSlots | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(0)
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null)
  const [pickerType, setPickerType]     = useState<MealType>('Main')
  const [search, setSearch]             = useState('')
  const [filterCat, setFilterCat]       = useState<'All'|'Brunch'|'Main'|'Side'>('All')

  const today     = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekDates = DAYS.map((_, i) => addDays(weekStart, i))

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [planData, recipeData] = await Promise.all([
      getActiveMealPlan(user.id),
      getRecipes(user.id),
    ])
    setPlan(planData)
    setRecipes(recipeData)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const slotsByDay: SlotsByDay = {}
  plan?.slots.forEach(slot => {
    if (!slotsByDay[slot.day_of_week]) slotsByDay[slot.day_of_week] = {}
    slotsByDay[slot.day_of_week][slot.meal_type as MealType] = slot
  })

  const activeSlots = slotsByDay[DAYS[activeDay]] ?? {}
  const activeMeals: MealType[] = ['Brunch', 'Main', 'Side']

  const dayTotal = activeMeals.reduce((sum, type) => {
    const slot = activeSlots[type]
    if (!slot?.recipe_id) return sum
    return sum + getMacros(slot.recipe_id).kcal
  }, 0)
  const target = plan?.daily_calorie_target ?? 1600
  const pct    = Math.min(Math.round((dayTotal / target) * 100), 100)

  const openPicker = (slotId: string | null, mealType: MealType) => {
    setPickerSlotId(slotId)
    setPickerType(mealType)
    setSearch('')
    setFilterCat(mealType)
    setPickerOpen(true)
  }

  const pickRecipe = async (recipe: Recipe) => {
    if (!plan) return
    const slotId = pickerSlotId

    // If no slot exists yet for this day/type, we need to add one to mock slots
    if (!slotId) {
      setPickerOpen(false)
      return
    }

    setPlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        slots: prev.slots.map(s =>
          s.id === slotId ? { ...s, recipe_id: recipe.id, recipe } : s
        ),
      }
    })
    await updateSlotRecipe(slotId, recipe.id)
    setPickerOpen(false)
  }

  const removeRecipe = async (slotId: string) => {
    setPlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        slots: prev.slots.map(s =>
          s.id === slotId ? { ...s, recipe_id: null, recipe: null } : s
        ),
      }
    })
    await updateSlotRecipe(slotId, null)
  }

  const filteredRecipes = recipes.filter(r => {
    const matchCat  = filterCat === 'All' || r.category === filterCat
    const matchText = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.source ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchText
  })

  if (loading) return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-berry px-5 pt-14 pb-3" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-berry border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading your plan…</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-berry px-5 pt-14 pb-3 flex justify-between items-center">
        <span className="text-white text-sm font-semibold">{format(today, 'EEE d MMM')}</span>
        <span className="text-white text-xs opacity-70">Future Healthy Self</span>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">Weekly Planner</h1>
        <span className="text-xs text-gray-400">{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d')}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Day selector */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {DAYS.map((day, i) => {
            const hasSlots = Object.keys(slotsByDay[day] ?? {}).length > 0
            const isToday  = format(weekDates[i], 'EEE') === format(today, 'EEE')
            const isActive = activeDay === i
            return (
              <button key={day} onClick={() => setActiveDay(i)}
                className={['flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border min-w-[46px] transition-all',
                  isActive ? 'bg-berry border-berry' : hasSlots ? 'border-olive bg-white' : isToday ? 'border-berry/40 bg-white' : 'border-gray-100 bg-white',
                ].join(' ')}>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>{DAY_LABELS[i]}</span>
                <span className={`text-base font-semibold ${isActive ? 'text-white' : 'text-gray-800'}`}>{weekDates[i].getDate()}</span>
                {(hasSlots || isToday) && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isActive ? 'bg-white/70' : hasSlots ? 'bg-olive' : 'bg-berry/40'}`} />}
              </button>
            )
          })}
        </div>

        {/* Meal slots */}
        {activeMeals.map(type => {
          const slot   = activeSlots[type]
          const recipe = slot?.recipe
          const macros = recipe ? getMacros(recipe.id) : null
          const colors = SLOT_COLORS[type]
          return (
            <div key={type} className="rounded-[14px] p-3.5 mb-2.5" style={{ background: colors.bg }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.label }}>{type}</span>
                {recipe && <button onClick={() => slot && removeRecipe(slot.id)} className="text-gray-300 text-xl leading-none">×</button>}
              </div>

              {recipe ? (
                <div onClick={() => slot && openPicker(slot.id, type)} className="cursor-pointer">
                  <div className="text-[15px] font-semibold text-gray-900 mb-1.5 leading-snug">{recipe.name}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">{macros?.kcal} kcal</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{macros?.protein}g protein</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{recipe.source}</span>
                  </div>
                </div>
              ) : (
                <button onClick={() => slot ? openPicker(slot.id, type) : openPicker(null, type)}
                  className="w-full flex items-center gap-2 py-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xl font-light" style={{ background: colors.label }}>+</div>
                  <span className="text-sm font-medium" style={{ color: colors.label }}>Add {type.toLowerCase()} recipe</span>
                </button>
              )}
            </div>
          )
        })}

        {/* Calorie bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Daily calories</span>
            <span className="font-semibold" style={{ color: pct >= 100 ? '#A72677' : '#6b7330' }}>
              {dayTotal.toLocaleString()} / {target.toLocaleString()} kcal
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: pct >= 100 ? '#A72677' : '#BAC35A' }} />
          </div>
        </div>
      </div>

      {/* RECIPE PICKER MODAL */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setPickerOpen(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[390px] mx-auto flex flex-col"
            style={{ maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>

            <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
              <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Choose {pickerType} recipe
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({filteredRecipes.length} of {recipes.length})
                  </span>
                </h2>
                <button onClick={() => setPickerOpen(false)} className="text-gray-400 text-sm font-medium px-2 py-1">Done</button>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2"/>
                  <path d="M20 20l-3-3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${recipes.length} recipes…`}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400" />
                {search && <button onClick={() => setSearch('')} className="text-gray-400 text-lg leading-none">×</button>}
              </div>

              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {(['All', 'Brunch', 'Main', 'Side'] as const).map(cat => (
                  <button key={cat} onClick={() => setFilterCat(cat)}
                    className={['flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      filterCat === cat ? 'text-white border-transparent' : 'bg-white text-gray-500 border-gray-200',
                    ].join(' ')}
                    style={filterCat === cat ? { background: cat === 'All' ? '#6b7280' : CAT_COLOR[cat] } : {}}>
                    {cat === 'All' ? `All (${recipes.length})` : `${cat} (${recipes.filter(r => r.category === cat).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipe list */}
            <div className="flex-1 overflow-y-auto">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm px-5">
                  No recipes found{search ? ` for "${search}"` : ''}
                </div>
              ) : (
                <div className="px-5 py-3">
                  {(['Brunch', 'Main', 'Side'] as const).map(cat => {
                    const catRecipes = filteredRecipes.filter(r => r.category === cat)
                    if (!catRecipes.length) return null
                    return (
                      <div key={cat} className="mb-5">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2"
                          style={{ color: CAT_COLOR[cat] }}>
                          <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[cat] }} />
                          {cat} · {catRecipes.length} recipes
                        </div>
                        {catRecipes.map(recipe => {
                          const m = getMacros(recipe.id)
                          return (
                            <button key={recipe.id} onClick={() => pickRecipe(recipe)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl mb-1 text-left border border-transparent hover:border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-all">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: CAT_COLOR[recipe.category] }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">{recipe.name}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{recipe.source} · {recipe.servings} servings</div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <div className="text-sm font-bold text-gray-700">{m.kcal}</div>
                                <div className="text-[10px] text-gray-400">kcal</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
