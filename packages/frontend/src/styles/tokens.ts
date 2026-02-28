/** Design tokens extracted from prototype */
export const T = {
  // Backgrounds
  bg: '#0a0a0a',
  bg1: '#111111',
  bg2: '#1a1a1a',
  bg3: '#222222',

  // Borders
  bdr: 'rgba(255,255,255,0.08)',
  bdr2: 'rgba(255,255,255,0.05)',

  // Text
  t: '#f0f0f0',
  t2: '#888888',
  t3: '#444444',
  t4: '#2a2a2a',

  // Fonts
  mono: "'Geist Mono', monospace",
  sans: "'Geist', -apple-system, sans-serif",

  // Status colors
  blu: '#3b82f6',
  grn: '#22c55e',
  amb: '#f59e0b',
  red: '#ef4444',
  pur: '#a855f7',
  cyn: '#06b6d4',
} as const

export const STATUS_COLORS: Record<string, string> = {
  active: T.blu,
  review: T.amb,
  done: T.grn,
  idle: T.t3,
  blocked: T.red,
}
