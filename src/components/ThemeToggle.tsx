'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  compact?: boolean
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('theme', next) } catch {}
    document.documentElement.setAttribute('data-theme', next)
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors text-xs font-mono"
    >
      {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
