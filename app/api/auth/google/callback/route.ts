import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/calendar?gcal=error', req.url))

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI!,
        grant_type:    'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (tokens.error) throw new Error(tokens.error_description)

    // Store tokens in Supabase against the user's profile
    // In mock mode, just redirect with success
    const response = NextResponse.redirect(new URL('/calendar?gcal=connected', req.url))
    // Set a short-lived cookie so the calendar page knows sync is enabled
    response.cookies.set('gcal_connected', '1', { maxAge: 60 * 60 * 24 * 30, httpOnly: false, sameSite: 'lax' })
    return response

  } catch (err) {
    console.error('GCal OAuth error:', err)
    return NextResponse.redirect(new URL('/calendar?gcal=error', req.url))
  }
}
