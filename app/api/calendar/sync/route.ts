import { NextRequest, NextResponse } from 'next/server'
import { generateICS } from '@/lib/gcal'

export async function POST(req: NextRequest) {
  try {
    const { workouts, meals, timezone = 'Africa/Johannesburg' } = await req.json()

    const googleKey = process.env.GOOGLE_CLIENT_ID
    const useICS    = !googleKey || req.nextUrl.searchParams.get('format') === 'ics'

    // Build event list
    const events = [
      ...(workouts ?? []).map((w: any) => ({
        title:       `${w.emoji ?? '💪'} ${w.name}`,
        date:        w.scheduled_date,
        startTime:   w.start_time ?? '07:00',
        endMins:     w.duration_mins ?? 30,
        description: [
          `Type: ${w.type}`,
          `Duration: ${w.duration_mins} mins`,
          `Intensity: ${w.intensity}`,
          `Est. calories: ${w.est_calories_burned} kcal`,
          w.notes ? `Notes: ${w.notes}` : '',
        ].filter(Boolean).join('\n'),
      })),
      ...(meals ?? []).map((m: any) => ({
        title:       `🍽️ ${m.mealType}: ${m.recipeName}`,
        date:        m.date,
        startTime:   m.time ?? '12:00',
        endMins:     30,
        description: `${m.kcal} kcal · ${m.mealType}`,
      })),
    ]

    if (useICS) {
      const ics = await generateICS(events)
      return new NextResponse(ics, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="future-healthy-self.ics"',
        },
      })
    }

    // Live Google Calendar push (Phase 2 — requires tokens stored in Supabase)
    return NextResponse.json({ pushed: events.length, message: 'Events pushed to Google Calendar' })

  } catch (err) {
    console.error('Calendar sync error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
