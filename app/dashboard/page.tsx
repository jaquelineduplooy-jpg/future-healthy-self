'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { getHealthLogsRange, getWorkoutsForWeek } from '@/lib/data'
import type { HealthLog, Workout } from '@/types/database'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getMacros, calcDayTotals } from '@/lib/utils'

const today = new Date()
const WEEK_START = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
const WEEK_END   = format(endOfWeek(today,   { weekStartsOn: 1 }), 'yyyy-MM-dd')
const THIRTY_DAYS_AGO = format(subDays(today, 29), 'yyyy-MM-dd')

export default function DashboardPage() {
  const { user } = useAuth()
  const [logs, setLogs]         = useState<HealthLog[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading]   = useState(true)
  const [range, setRange]       = useState<'7d' | '30d'>('7d')

  const load = useCallback(async () => {
    if (!user) return
    const [logsData, wData] = await Promise.all([
      getHealthLogsRange(user.id, THIRTY_DAYS_AGO, format(today, 'yyyy-MM-dd')),
      getWorkoutsForWeek(user.id, WEEK_START, WEEK_END),
    ])
    setLogs(logsData)
    setWorkouts(wData)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Compute stats
  const rangeLogs = range === '7d' ? logs.slice(-7) : logs
  const avgCalories = rangeLogs.length ? Math.round(rangeLogs.reduce((s, l) => s + 1500, 0) / rangeLogs.length) : 0 // placeholder until calorie tracking is wired
  const avgWater    = rangeLogs.length ? Math.round(rangeLogs.reduce((s, l) => s + (l.water_ml ?? 0), 0) / rangeLogs.length / 100) / 10 : 0
  const avgMood     = rangeLogs.length ? Math.round(rangeLogs.reduce((s, l) => s + (l.mood_score ?? 3), 0) / rangeLogs.length * 10) / 10 : 0

  const doneWorkouts    = workouts.filter(w => w.status === 'Done').length
  const plannedWorkouts = workouts.filter(w => w.status !== 'Rest Day').length
  const totalKcalBurned = workouts.filter(w => w.status === 'Done').reduce((s, w) => s + (w.actual_calories_burned ?? 0), 0)

  // Weight trend data
  const weightData = logs.filter(l => l.weight_kg).map(l => ({
    date: format(new Date(l.log_date), 'MMM d'),
    weight: l.weight_kg,
  }))

  const startWeight = logs.find(l => l.weight_kg)?.weight_kg ?? 76
  const latestWeight = logs.filter(l => l.weight_kg).at(-1)?.weight_kg ?? 76
  const weightLost = Math.round((startWeight - latestWeight) * 10) / 10
  const goalWeight = 68
  const progressPct = Math.min(Math.round(((startWeight - latestWeight) / (startWeight - goalWeight)) * 100), 100)

  // Calorie bar chart (mock daily calories — replace with calcDayTotals when daily_logs fully wired)
  const calData = rangeLogs.map(l => ({
    date: format(new Date(l.log_date), 'EEE'),
    kcal: 1400 + Math.round(Math.random() * 400), // replace with real calc
  }))

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
        <h1 className="text-lg font-semibold text-gray-900">My progress</h1>
        <div className="flex gap-1.5">
          {(['7d', '30d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${range === r ? 'bg-berry text-white' : 'bg-gray-100 text-gray-500'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Hero weight card */}
        <div className="bg-berry rounded-[16px] p-5 text-white">
          <div className="text-xs text-white/75 mb-1">Weight lost since Day 1</div>
          <div className="text-4xl font-semibold">
            {weightLost > 0 ? `−${weightLost}` : weightLost} kg
          </div>
          <div className="text-sm text-white/80 mt-1">
            Current: {latestWeight} kg · Goal: {goalWeight} kg
          </div>
          <div className="h-1.5 bg-white/25 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-white/60">{startWeight} kg start</span>
            <span className="text-[11px] text-white/60">{progressPct}% to goal</span>
          </div>
        </div>

        {/* Weight trend chart */}
        {weightData.length > 1 && (
          <div className="bg-gray-50 rounded-[14px] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Weight trend</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={weightData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <ReferenceLine y={goalWeight} stroke="#FBCE1D" strokeDasharray="4 2" strokeWidth={1.5} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="weight" stroke="#A72677" strokeWidth={2.5} dot={{ fill: '#A72677', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gray-50 rounded-[14px] p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Water avg</div>
            <div className="text-xl font-semibold text-gray-900">{avgWater}L</div>
            <div className="text-xs text-mint-dark mt-0.5">↑ this {range}</div>
          </div>
          <div className="bg-gray-50 rounded-[14px] p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Avg mood</div>
            <div className="text-xl font-semibold text-gray-900">{avgMood} / 5</div>
            <div className="text-xs text-gray-400 mt-0.5">this {range}</div>
          </div>
          <div className="bg-gray-50 rounded-[14px] p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Workouts</div>
            <div className="text-xl font-semibold text-gray-900">{doneWorkouts}/{plannedWorkouts}</div>
            <div className="text-xs text-mint-dark mt-0.5">this week</div>
          </div>
          <div className="bg-gray-50 rounded-[14px] p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">kcal burned</div>
            <div className="text-xl font-semibold text-gray-900">{totalKcalBurned.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-0.5">this week</div>
          </div>
        </div>

        {/* Calorie bar chart */}
        {calData.length > 0 && (
          <div className="bg-gray-50 rounded-[14px] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Daily calories</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={calData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <ReferenceLine y={1600} stroke="#BAC35A" strokeDasharray="4 2" strokeWidth={1.5} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="kcal" fill="#BAC35A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Streaks */}
        <div className="flex gap-2.5 pb-4">
          <div className="flex-1 bg-berry-light rounded-[14px] p-3.5 text-center">
            <div className="text-3xl font-semibold text-berry">12</div>
            <div className="text-xs text-berry font-semibold mt-1">Day streak</div>
          </div>
          <div className="flex-1 bg-gold-light rounded-[14px] p-3.5 text-center">
            <div className="text-3xl font-semibold text-gold-dark">{doneWorkouts}</div>
            <div className="text-xs text-gold-dark font-semibold mt-1">Workouts</div>
          </div>
          <div className="flex-1 bg-olive-light rounded-[14px] p-3.5 text-center">
            <div className="text-3xl font-semibold text-olive-dark">28</div>
            <div className="text-xs text-olive-dark font-semibold mt-1">Recipes tried</div>
          </div>
        </div>
      </div>
    </div>
  )
}
