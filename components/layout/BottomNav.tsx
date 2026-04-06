'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/planner',   label: 'Planner',  icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5" fill={a?'#A72677':'none'}/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5" fill="none"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5" fill="none"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5" fill="none"/></svg> },
  { href: '/shopping',  label: 'Shopping', icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h12" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/tracker',   label: 'Track',    icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5"/><path d="M12 7v5l3 3" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { href: '/dashboard', label: 'Progress', icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 17l4-8 4 5 3-3 4 6" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: '/calendar',  label: 'Calendar', icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5"/><path d="M3 9h18M9 4v5M15 4v5" stroke={a?'#A72677':'#9CA3AF'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-white border-t border-gray-100 safe-area-bottom z-50">
      <div className="flex">
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || path.startsWith(href + '/')
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-2 px-1 no-underline">
              {icon(active)}
              <span className={`text-[10px] font-semibold ${active ? 'text-berry' : 'text-gray-400'}`}>{label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-berry" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
