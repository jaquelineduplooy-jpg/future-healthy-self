'use client'
import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW:', reg.scope))
        .catch(err => console.warn('SW failed:', err))
    }
  }, [])
  return null
}
