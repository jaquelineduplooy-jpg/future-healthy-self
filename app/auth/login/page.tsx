'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const { signIn } = useAuth()
  const router     = useRouter()

  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      router.push('/planner')
    }
  }

  const handleDemo = () => router.push('/planner')

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-berry px-6 pt-16 pb-10 text-center">
        <div className="text-4xl mb-3">🥗</div>
        <h1 className="text-2xl font-bold text-white">Future Healthy Self</h1>
        <p className="text-white/70 text-sm mt-1">Your personal wellness companion</p>
      </div>

      <div className="flex-1 px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h2>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm outline-none focus:border-berry transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm outline-none focus:border-berry transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-berry font-semibold">Sign up</Link>
        </p>

        <button
          onClick={handleDemo}
          className="w-full mt-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-400 bg-white"
        >
          Continue with demo data →
        </button>
      </div>
    </div>
  )
}
