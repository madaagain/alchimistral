import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type ThemeMode = 'dark' | 'light'

interface ThemeColors {
  bg: string
  bg1: string
  bg2: string
  bg3: string
  bdr: string
  bdr2: string
  t: string
  t2: string
  t3: string
  t4: string
  mono: string
  sans: string
  blu: string
  grn: string
  amb: string
  red: string
  pur: string
  cyn: string
}

const DARK: ThemeColors = {
  bg: '#0a0a0a',
  bg1: '#111111',
  bg2: '#1a1a1a',
  bg3: '#222222',
  bdr: 'rgba(255,255,255,0.08)',
  bdr2: 'rgba(255,255,255,0.05)',
  t: '#f0f0f0',
  t2: '#888888',
  t3: '#444444',
  t4: '#2a2a2a',
  mono: "'Geist Mono', monospace",
  sans: "'Geist', -apple-system, sans-serif",
  blu: '#3b82f6',
  grn: '#22c55e',
  amb: '#f59e0b',
  red: '#ef4444',
  pur: '#a855f7',
  cyn: '#06b6d4',
}

const LIGHT: ThemeColors = {
  bg: '#fafafa',
  bg1: '#ffffff',
  bg2: '#f0f0f0',
  bg3: '#e5e5e5',
  bdr: 'rgba(0,0,0,0.08)',
  bdr2: 'rgba(0,0,0,0.05)',
  t: '#1a1a1a',
  t2: '#666666',
  t3: '#999999',
  t4: '#cccccc',
  mono: "'Geist Mono', monospace",
  sans: "'Geist', -apple-system, sans-serif",
  blu: '#3b82f6',
  grn: '#22c55e',
  amb: '#f59e0b',
  red: '#ef4444',
  pur: '#a855f7',
  cyn: '#06b6d4',
}

interface ThemeContextValue {
  mode: ThemeMode
  theme: ThemeColors
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  theme: DARK,
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('alchemistral-theme')
    return stored === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    localStorage.setItem('alchemistral-theme', mode)
    document.body.style.background = mode === 'dark' ? DARK.bg : LIGHT.bg
    document.body.style.color = mode === 'dark' ? DARK.t : LIGHT.t
  }, [mode])

  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'))
  const theme = mode === 'dark' ? DARK : LIGHT

  return (
    <ThemeContext.Provider value={{ mode, theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export const STATUS_COLORS: Record<string, string> = {
  active: DARK.blu,
  review: DARK.amb,
  done: DARK.grn,
  idle: DARK.t3,
  blocked: DARK.red,
  pending: DARK.t3,
  spawning: DARK.blu,
  failed: DARK.red,
}
