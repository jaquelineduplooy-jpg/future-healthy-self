'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import { getActiveMealPlan } from '@/lib/data'
import { scaleAmount } from '@/lib/utils'
import type { MealPlanWithSlots, Ingredient } from '@/types/database'

type ShopItem = Ingredient & { recipeName: string; checked: boolean; priceEst: number }
type CategoryMap = Record<string, ShopItem[]>

const CATEGORY_RULES: Record<string, string> = {
  egg: 'Dairy & Eggs', cheese: 'Dairy & Eggs', butter: 'Dairy & Eggs', cream: 'Dairy & Eggs', milk: 'Dairy & Eggs', yogurt: 'Dairy & Eggs',
  chicken: 'Meat', beef: 'Meat', pork: 'Meat', lamb: 'Meat', mince: 'Meat', sausage: 'Meat', bacon: 'Meat',
  salmon: 'Seafood', fish: 'Seafood', prawn: 'Seafood', tuna: 'Seafood', mussel: 'Seafood',
  cabbage: 'Produce', lime: 'Produce', coriander: 'Produce', sprout: 'Produce', avocado: 'Produce', avo: 'Produce', tomato: 'Produce', onion: 'Produce', garlic: 'Produce', kale: 'Produce', broccoli: 'Produce', spinach: 'Produce', asparagus: 'Produce', mushroom: 'Produce', lemon: 'Produce',
}

function categorise(name: string): string {
  const lower = name.toLowerCase()
  for (const [keyword, cat] of Object.entries(CATEGORY_RULES)) {
    if (lower.includes(keyword)) return cat
  }
  return 'Pantry'
}

const CATEGORY_ORDER = ['Produce', 'Meat', 'Seafood', 'Dairy & Eggs', 'Pantry', 'Other']

// Rough price estimates (ZAR) per unit - easily replaceable with a real prices table
const PRICE_EST: Record<string, number> = { each: 4, bunch: 12, cup: 8, tbsp: 2, tsp: 1, g: 0.03, kg: 30, ml: 0.02, L: 20, cloves: 1, pinch: 0.5 }

export default function ShoppingPage() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<MealPlanWithSlots | null>(null)
  const [loading, setLoading] = useState(true)
  const [people, setPeople] = useState(2)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!user) return
    const data = await getActiveMealPlan(user.id)
    setPlan(data)
    if (data) setPeople(data.people_count)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Build consolidated ingredient list from all recipe slots
  const allItems = useMemo<ShopItem[]>(() => {
    if (!plan) return []
    const map = new Map<string, ShopItem>()

    plan.slots.forEach(slot => {
      if (!slot.recipe) return
      // In real mode, recipe would include ingredients via join
      // In mock mode, we import MOCK_INGREDIENTS
      const { MOCK_INGREDIENTS } = require('@/lib/mock-data')
      const ings: Ingredient[] = MOCK_INGREDIENTS.filter((i: Ingredient) => i.recipe_id === slot.recipe_id)
      ings.forEach(ing => {
        const key = `${ing.name.toLowerCase().trim()}-${ing.unit}`
        if (map.has(key)) {
          const existing = map.get(key)!
          existing.amount = (existing.amount ?? 0) + (ing.amount ?? 0)
        } else {
          map.set(key, {
            ...ing,
            recipeName: slot.recipe!.name,
            checked: false,
            priceEst: (ing.amount ?? 1) * (PRICE_EST[ing.unit ?? 'each'] ?? 5),
          })
        }
      })
    })
    return Array.from(map.values())
  }, [plan])

  const categories = useMemo<CategoryMap>(() => {
    const cats: CategoryMap = {}
    allItems.forEach(item => {
      const cat = categorise(item.name)
      if (!cats[cat]) cats[cat] = []
      const scaledItem = {
        ...item,
        amount: scaleAmount(item.amount ?? 1, 2, people),
        checked: checked.has(item.id),
      }
      cats[cat].push(scaledItem)
    })
    return cats
  }, [allItems, people, checked])

  const totalEst = useMemo(() =>
    allItems.reduce((sum, item) => sum + item.priceEst * (people / 2), 0),
    [allItems, people]
  )

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const formatAmount = (amount: number, unit: string | null): string => {
    if (!unit) return String(Math.round(amount * 100) / 100)
    if (amount === 0.5) return `½ ${unit}`
    if (amount === 0.25) return `¼ ${unit}`
    if (amount === 0.75) return `¾ ${unit}`
    return `${Math.round(amount * 100) / 100} ${unit}`
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-berry border-t-transparent animate-spin" /></div>

  const orderedCats = CATEGORY_ORDER.filter(c => categories[c]?.length > 0)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-berry px-5 pt-14 pb-3 flex justify-between items-center">
        <span className="text-white text-sm font-semibold">9:41</span>
        <span className="text-white text-xs">●●●</span>
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">Shopping list</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-500">PDF</button>
          <button className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-500">Share</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* People scaler */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-[14px] px-4 py-3 mb-5">
          <span className="flex-1 text-sm text-gray-500">Cooking for</span>
          <button onClick={() => setPeople(p => Math.max(1, p - 1))}
            className="w-8 h-8 rounded-full bg-berry text-white text-xl flex items-center justify-center border-0 leading-none">−</button>
          <span className="text-xl font-semibold text-gray-900 w-6 text-center">{people}</span>
          <button onClick={() => setPeople(p => Math.min(8, p + 1))}
            className="w-8 h-8 rounded-full bg-berry text-white text-xl flex items-center justify-center border-0 leading-none">+</button>
          <span className="text-sm text-gray-500">people</span>
        </div>

        {/* Progress */}
        <div className="flex justify-between text-xs text-gray-400 mb-4">
          <span>{checked.size} of {allItems.length} items ticked</span>
          <span className="font-medium text-mint-dark">{Math.round((checked.size / Math.max(allItems.length, 1)) * 100)}% done</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div className="h-full bg-mint-dark rounded-full transition-all" style={{ width: `${Math.round((checked.size / Math.max(allItems.length, 1)) * 100)}%` }} />
        </div>

        {/* Category sections */}
        {orderedCats.map(cat => (
          <div key={cat}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-4 mb-2">{cat}</div>
            {categories[cat].map(item => (
              <div key={item.id}
                className="flex items-center gap-3 py-2.5 border-b border-gray-50 cursor-pointer"
                onClick={() => toggleCheck(item.id)}>
                <div className={[
                  'w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                  item.checked ? 'bg-mint-dark border-mint-dark' : 'border-gray-200'
                ].join(' ')}>
                  {item.checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className={`flex-1 text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.name}</span>
                <span className="text-xs text-gray-400">{formatAmount(item.amount ?? 0, item.unit)}</span>
                <span className="text-sm font-semibold text-gray-700 ml-1">R{(item.priceEst * (people / 2)).toFixed(0)}</span>
              </div>
            ))}
          </div>
        ))}

        {allItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No meals planned yet.</p>
            <p className="text-gray-300 text-xs mt-1">Add recipes in the Planner to generate your list.</p>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center bg-berry rounded-[14px] px-4 py-3.5 mt-5">
          <span className="text-sm text-white/80">Estimated total</span>
          <span className="text-xl font-semibold text-white">R{totalEst.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}
