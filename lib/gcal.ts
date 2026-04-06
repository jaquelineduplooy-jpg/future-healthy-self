/**
 * Google Calendar helpers.
 * Generates ICS calendar files and pushes events via the Google Calendar API.
 */

export async function generateICS(events: {
  title: string
  date: string
  startTime: string
  endMins: number
  description: string
}[]): Promise<string> {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Future Healthy Self//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const e of events) {
    const start = new Date(`${e.date}T${e.startTime}:00Z`)
    const end   = new Date(start.getTime() + e.endMins * 60000)
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${e.title}`,
      `DESCRIPTION:${e.description.replace(/\n/g, '\\n')}`,
      `UID:fhs-${Date.now()}-${Math.random().toString(36).slice(2)}@future-healthy-self`,
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export async function pushWorkoutToCalendar(
  tokens: { access_token: string; refresh_token: string },
  workout: {
    name: string
    type: string
    date: string
    startTime: string
    durationMins: number
    intensity: string
    kcal: number
    notes?: string
  }
) {
  const TYPE_EMOJI: Record<string, string> = {
    Walking: '🚶', Running: '🏃', Cycling: '🚴', Strength: '🏋️',
    Yoga: '🧘', HIIT: '⚡', Stretching: '🤸', Other: '💪',
  }

  const COLOUR_MAP: Record<string, string> = {
    High: '11', Medium: '5', Low: '2',
  }

  const tz    = process.env.NEXT_PUBLIC_TIMEZONE || 'Africa/Johannesburg'
  const start = new Date(`${workout.date}T${workout.startTime}:00`)
  const end   = new Date(start.getTime() + workout.durationMins * 60000)
  const emoji = TYPE_EMOJI[workout.type] ?? '💪'

  const body = {
    summary:     `${emoji} ${workout.name}`,
    description: [
      `Type: ${workout.type}`,
      `Duration: ${workout.durationMins} mins`,
      `Intensity: ${workout.intensity}`,
      `Est. calories: ${workout.kcal} kcal`,
      workout.notes ? `Notes: ${workout.notes}` : '',
    ].filter(Boolean).join('\n'),
    start: { dateTime: start.toISOString(), timeZone: tz },
    end:   { dateTime: end.toISOString(),   timeZone: tz },
    colorId: COLOUR_MAP[workout.intensity] ?? '2',
    extendedProperties: {
      private: { source: 'future-healthy-self', type: 'workout' },
    },
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Google Calendar API error: ${JSON.stringify(err)}`)
  }

  return res.json()
}
