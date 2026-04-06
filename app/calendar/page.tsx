'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { getWorkoutsForWeek, getActiveMealPlan } from '@/lib/data'
import type { Workout } from '@/types/database'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths,
} from 'date-fns'

const today = new Date()

type DayCell = {
  date: Date
  isToday: boolean
  isCurrentMonth: boolean
  hasEvents: boolean
  compliance: 'green' | 'amber' | 'none'
}

type Event = {
  time: string
  name: string
  meta: string
  color: string
  chipClass: string
  chipLabel: string
}

export default function CalendarPage() {
  const { user }       = useAuth()
  const [month, setMonth] = useState(today)
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [exporting, setExporting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [gcalConnected, setGcalConnected] = useState(false)
  const [selectedDay, setSelectedDay] = useState(today)

  // Check if Google Calendar was connected (via cookie set on OAuth callback)
  useEffect(() => {
    setGcalConnected(document.cookie.includes('gcal_connected=1'))
    // Check URL params for connection result
    const params = new URLSearchParams(window.location.search)
    if (params.get('gcal') === 'connected') setGcalConnected(true)
  }, [])

  const load = useCallback(async () => {
    if (!user) return
    const start = format(startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const end   = format(endOfWeek(endOfMonth(month),   { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const data  = await getWorkoutsForWeek(user.id, start, end)
    setWorkouts(data)
  }, [user, month])

  useEffect(() => { load() }, [load])

  // Build calendar grid
  const calStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const calEnd   = endOfWeek(endOfMonth(month),     { weekStartsOn: 1 })
  const cells: DayCell[] = []
  let cur = calStart
  while (cur <= calEnd) {
    const dateStr = format(cur, 'yyyy-MM-dd')
    const dayWorkouts = workouts.filter(w => w.scheduled_date === dateStr)
    const allDone = dayWorkouts.length > 0 && dayWorkouts.every(w => w.status === 'Done' || w.status === 'Rest Day')
    cells.push({
      date: cur,
      isToday: isSameDay(cur, today),
      isCurrentMonth: isSameMonth(cur, month),
      hasEvents: dayWorkouts.length > 0,
      compliance: allDone ? 'green' : dayWorkouts.some(w => w.status === 'Done') ? 'amber' : 'none',
    })
    cur = addDays(cur, 1)
  }

  const cellClass = (c: DayCell) => {
    if (c.isToday) return 'bg-berry text-white font-bold'
    if (!c.isCurrentMonth) return 'text-gray-300'
    if (c.compliance === 'green') return 'bg-mint-light text-mint-deep'
    if (c.compliance === 'amber') return 'bg-gold-light text-gold-dark'
    return 'text-gray-700'
  }

  // Events for selected day
  const selectedStr = format(selectedDay, 'yyyy-MM-dd')
  const dayWorkouts = workouts.filter(w => w.scheduled_date === selectedStr)
  const events: Event[] = dayWorkouts.map(w => ({
    time:      w.start_time?.slice(0, 5) ?? '–',
    name:      w.name,
    meta:      `${w.type} · ${w.duration_mins} min`,
    color:     w.type === 'HIIT' || w.type === 'Strength' ? 'bg-berry' : w.type === 'Running' ? 'bg-orange' : 'bg-olive',
    chipClass: w.status === 'Done' ? 'chip-mint' : w.status === 'Planned' ? 'chip-gold' : 'bg-gray-100 text-gray-400',
    chipLabel: w.status,
  }))

  const exportICS = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/calendar/sync?format=ics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workouts: workouts.map(w => ({
            name: w.name, type: w.type, scheduled_date: w.scheduled_date,
            start_time: w.start_time, duration_mins: w.duration_mins,
            intensity: w.intensity, est_calories_burned: w.est_calories_burned,
            notes: w.notes, emoji: '💪',
          })),
        }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = 'future-healthy-self.ics'
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setExporting(false)
      setShowModal(false)
    }
  }

  const connectGCal = () => {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-berry px-5 pt-14 pb-3 flex justify-between items-center">
        <span className="text-white text-sm font-semibold">9:41</span>
        <span className="text-white text-xs">●●●</span>
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">Calendar</h1>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">W</button>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-berry text-xl font-light">+</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Month nav */}
        <div className="flex justify-between items-center mb-3">
          <button onClick={() => setMonth(m => subMonths(m, 1))}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">‹</button>
          <span className="text-base font-semibold text-gray-900">{format(month, 'MMMM yyyy')}</span>
          <button onClick={() => setMonth(m => addMonths(m, 1))}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">›</button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 mb-3">
          {cells.map((cell, i) => (
            <button key={i}
              onClick={() => setSelectedDay(cell.date)}
              className={[
                'aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all',
                cellClass(cell),
                isSameDay(cell.date, selectedDay) && !cell.isToday ? 'ring-2 ring-berry' : '',
              ].join(' ')}>
              {cell.date.getDate()}
              {cell.hasEvents && (
                <div className={`absolute bottom-1 w-1 h-1 rounded-full ${cell.isToday ? 'bg-white/70' : 'bg-orange'}`} />
              )}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-xs mb-4 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-mint-light inline-block" /><span className="text-gray-400">All habits hit</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gold-light inline-block" /><span className="text-gray-400">Partial</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange inline-block" /><span className="text-gray-400">Has events</span></span>
        </div>

        {/* GCal sync strip */}
        <div className="bg-berry-light border border-berry/20 rounded-[14px] p-3.5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="18" rx="2" stroke="#A72677" strokeWidth="1.5"/>
                <path d="M2 9h20M9 4v5M15 4v5" stroke="#A72677" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-berry">
                {gcalConnected ? 'Google Calendar connected' : 'Sync to Google Calendar'}
              </div>
              <div className="text-xs text-berry/70 mt-0.5">
                {workouts.filter(w => w.status === 'Planned').length} workouts planned this month
              </div>
            </div>
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-full bg-berry text-white text-xs font-semibold border-0 whitespace-nowrap">
              Export
            </button>
          </div>
        </div>

        {/* Selected day events */}
        <div className="text-sm font-semibold text-gray-800 mb-3">
          {format(selectedDay, 'EEEE, d MMM')}
        </div>
        {events.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-4">No events planned.</div>
        )}
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
            <div className={`w-1 h-9 rounded-full flex-shrink-0 ${e.color}`} />
            <div className="text-xs text-gray-400 w-10 flex-shrink-0">{e.time}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{e.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{e.meta}</div>
            </div>
            <span className={`chip text-xs ${e.chipClass}`}>{e.chipLabel}</span>
          </div>
        ))}
      </div>

      {/* Export modal */}
      {showModal && (
        <div className="absolute inset-0 bg-black/40 flex items-end z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-[390px] mx-auto" onClick={e => e.stopPropagation()}>
            <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="text-base font-semibold text-gray-900 mb-1">Export to calendar</div>
            <div className="text-sm text-gray-400 mb-4">Choose how to add your plan to Google Calendar</div>
            {[
              { icon: '📅', name: 'Live Google Calendar sync', desc: 'Connect once — events update automatically', action: connectGCal, recommended: true },
              { icon: '📎', name: 'Download .ics file',         desc: 'Import once into any calendar app',          action: exportICS,    recommended: false },
              { icon: '🔗', name: 'Subscribe via URL',          desc: 'Google auto-refreshes your plan',           action: () => {},     recommended: false },
            ].map((opt, i) => (
              <div key={i} onClick={opt.action}
                className={[
                  'flex items-center gap-3 p-3.5 rounded-xl border mb-2.5 cursor-pointer transition-all',
                  opt.recommended ? 'border-berry bg-berry-light' : 'border-gray-100 bg-white',
                ].join(' ')}>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl flex-shrink-0">{opt.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">{opt.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                </div>
                {opt.recommended && (
                  <div className="w-5 h-5 rounded-full bg-berry flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </div>
            ))}
            <button onClick={exportICS} disabled={exporting}
              className="btn-primary mt-2 disabled:opacity-50">
              {exporting ? 'Generating…' : 'Connect Google Calendar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
