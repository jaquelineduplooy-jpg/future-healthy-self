'use client'

import { createContext, useContext, useState } from 'react'
import type { User } from '@supabase/supabase-js'

// Real Supabase user ID — matches meal_plans.user_id in database
const USER_ID = process.env.NEXT_PUBLIC_APP_USER_ID ?? 'mock-user'

const JACKIE: User = {
  id: USER_ID,
  email: 'jaqueline.duplooy@gmail.com',
  created_at: '2026-01-01',
  app_metadata: {},
  user_metadata: { full_name: 'Jackie' },
  aud: 'authenticated',
  role: 'authenticated',
  updated_at: '2026-01-01',
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User | null>(JACKIE)
  return (
    <AuthContext.Provider value={{
      user,
      loading: false,
      signIn:  async () => ({ error: null }),
      signUp:  async () => ({ error: null }),
      signOut: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
