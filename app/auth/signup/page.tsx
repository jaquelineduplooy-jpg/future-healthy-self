'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    if (password !== confirm)  { setError('Passwords do not match'); return }
    if (password.length < 8)   { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError(null)
    const { error } = await signUp(email, password)
    if (error) { setError(error); setLoading(false) }
    else router.push('/planner')
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-berry px-6 pt-16 pb-10 text-center">
        <div className="text-4xl mb-3">🌱</div>
        <h1 className="text-2xl font-bold text-white">Start your journey</h1>
        <p className="text-white/70 text-sm mt-1">Your Future Healthy Self starts today</p>
      </div>

      <div className="flex-1 px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create account</h2>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700 mb-4">{error}</div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-berry transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-berry transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-berry transition-colors" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          By signing up you agree to our terms and privacy policy.
        </p>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-berry font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
