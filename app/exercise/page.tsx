'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { getWorkoutsForWeek, updateWorkoutStatus, createWorkout } from '@/lib/data'
import type { Workout } from '@/types/database'
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'

const today = new Date()
const WEEK_START = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
const WEEK_END   = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')

const TYPE_EMOJI: Record<string, string> = {
  Walking: '🚶', Running: '🏃', Cycling: '🚴', Strength: '🏋️',
  Yoga: '🧘', HIIT: '⚡', Stretching: '🤸', Pilates: '🤸', Swimming: '🏊', Other: '💪',
}

const STATUS_STYLE: Record<string, string> = {
  Done:      'bg-mint-light text-mint-deep',
  Planned:   'bg-gold-light text-gold-dark',
  Skipped:   'bg-red-50 text-red-600',
  'Rest Day':'bg-gray-100 text-gray-400',
}

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function ExercisePage() {
  const { user }   = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState(
    (today.getDay() + 6) % 7 // Mon=0 … Sun=6
  )

  const weekDates = DAYS.map((_, i) => addDays(startOfWeek(today, { weekStartsOn: 1 }), i))

  const load = useCallback(async () => {
    if (!user) return
    const data = await getWorkoutsForWeek(user.id, WEEK_START, WEEK_END)
    setWorkouts(data)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const markDone = async (workout: Workout) => {
    setSaving(workout.id)
    const newStatus: Workout['status'] = workout.status === 'Done' ? 'Planned' : 'Done'
    await updateWorkoutStatus(workout.id, newStatus)
    setWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, status: newStatus } : w))
    setSaving(null)
  }

  const skipWorkout = async (workout: Workout) => {
    setSaving(workout.id)
    await updateWorkoutStatus(workout.id, 'Skipped')
    setWorkouts(prev => prev.map(w => w.id === workout.id ? { ...w, status: 'Skipped' } : w))
    setSaving(null)
  }

  const doneCount   = workouts.filter(w => w.status === 'Done').length
  const totalMins   = workouts.filter(w => w.status === 'Done').reduce((s, w) => s + (w.duration_mins ?? 0), 0)
  const totalKcal   = workouts.filter(w => w.status === 'Done').reduce((s, w) => s + (w.actual_calories_burned ?? w.est_calories_burned ?? 0), 0)
  const plannedCount = workouts.filter(w => w.status !== 'Rest Day').length

  const activeDayDate = format(weekDates[activeDay], 'yyyy-MM-dd')
  const dayWorkouts   = workouts.filter(w => w.scheduled_date === activeDayDate)

  if (loading) return (
    <div className="h-screen bg-white flex items-center justify-center">
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
        <h1 className="text-lg font-semibold text-gray-900">Exercise</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-500">Plan week</button>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-berry text-xl font-light">+</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Week strip */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
          {DAYS.map((day, i) => {
            const date      = format(weekDates[i], 'yyyy-MM-dd')
            const dayW      = workouts.filter(w => w.scheduled_date === date)
            const hasDone   = dayW.some(w => w.status === 'Done')
            const hasPlanned= dayW.some(w => w.status === 'Planned')
            const isToday   = date === format(today, 'yyyy-MM-dd')
            return (
              <button key={day} onClick={() => setActiveDay(i)}
                className={[
                  'flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-xl border min-w-[44px] transition-all',
                  activeDay === i  ? 'bg-berry border-berry' :
                  hasDone          ? 'border-mint-dark bg-white' :
                  hasPlanned       ? 'border-olive bg-white' :
                                     'border-gray-100 bg-white opacity-50',
                ].join(' ')}>
                <span className={`text-[10px] font-semibold ${activeDay === i ? 'text-white' : 'text-gray-400'}`}>{day.toUpperCase().slice(0,3)}</span>
                <span className={`text-sm font-semibold mt-0.5 ${activeDay === i ? 'text-white' : 'text-gray-800'}`}>{weekDates[i].getDate()}</span>
                {(hasDone || hasPlanned) && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${activeDay === i ? 'bg-white/70' : hasDone ? 'bg-mint-dark' : 'bg-olive'}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Stats */}
        <div className="flex bg-gray-50 rounded-[14px] p-3 mb-4">
          <div className="flex-1 text-center">
            <div className="text-xl font-semibold text-berry">{doneCount}/{plannedCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">Sessions</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="text-xl font-semibold text-olive-dark">{totalMins}</div>
            <div className="text-xs text-gray-400 mt-0.5">Mins done</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="text-xl font-semibold text-orange-dark">{totalKcal}</div>
            <div className="text-xs text-gray-400 mt-0.5">kcal burned</div>
          </div>
        </div>

        {/* Day workouts */}
        {dayWorkouts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No workouts planned for this day.</p>
            <button className="mt-3 text-sm text-berry font-semibold">+ Add workout</button>
          </div>
        )}

        {dayWorkouts.map(w => (
          <div key={w.id} className={[
            'rounded-[14px] p-4 mb-3 border',
            w.status === 'Done'     ? 'bg-mint-light/30 border-mint-light' :
            w.status === 'Planned'  ? 'bg-gold-light border-yellow-200' :
            w.status === 'Skipped'  ? 'bg-red-50/50 border-red-100' :
                                       'bg-gray-50 border-gray-100',
          ].join(' ')}>
            <div className="flex items-center gap-3 mb-3">
              <div className={[
                'w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
                w.status === 'Done' ? 'bg-mint-light' : w.status === 'Planned' ? 'bg-gold-light' : 'bg-gray-100'
              ].join(' ')}>
                {TYPE_EMOJI[w.type ?? 'Other'] ?? '💪'}
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-gray-900">{w.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {w.start_time ? `${w.start_time.slice(0, 5)} · ` : ''}{w.duration_mins}min{w.intensity ? ` · ${w.intensity}` : ''}
                </div>
              </div>
              <span className={`chip text-xs font-semibold ${STATUS_STYLE[w.status]}`}>{w.status}</span>
            </div>

            {w.notes && <p className="text-xs text-gray-500 mb-3">{w.notes}</p>}

            <div className="flex gap-2 flex-wrap">
              {w.est_calories_burned ? (
                <span className="chip bg-gray-100 text-gray-500 text-xs">{w.actual_calories_burned ?? w.est_calories_burned} kcal</span>
              ) : null}
              {w.intensity && w.status !== 'Rest Day' && (
                <span className={`chip text-xs ${w.intensity === 'High' ? 'bg-red-50 text-red-600' : w.intensity === 'Medium' ? 'bg-orange-light text-orange-dark' : 'chip-mint'}`}>
                  {w.intensity} intensity
                </span>
              )}
            </div>

            {w.status === 'Planned' && (
              <div className="flex gap-2 mt-3">
                <button
                  disabled={saving === w.id}
                  onClick={() => markDone(w)}
                  className="flex-1 py-2.5 rounded-xl bg-mint-dark text-white text-xs font-semibold border-0 disabled:opacity-50">
                  {saving === w.id ? '…' : '✓ Mark done'}
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 text-xs font-semibold">Edit</button>
                <button
                  disabled={saving === w.id}
                  onClick={() => skipWorkout(w)}
                  className="flex-1 py-2.5 rounded-xl bg-white border border-gray-200 text-red-500 text-xs font-semibold disabled:opacity-50">
                  Skip
                </button>
              </div>
            )}

            {w.status === 'Skipped' && (
              <button onClick={() => markDone(w)} className="mt-2 w-full py-2 rounded-xl border border-gray-200 text-xs text-gray-500">
                Undo — mark as planned
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
