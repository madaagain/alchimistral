import { useState, useEffect } from 'react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import logoUrl from '../../assets/alchimistral-logo.svg'
import { getKeys, updateKeys } from '../api/settings'

// Welcome screen is always dark
const D = {
  bg: '#0a0a0a',
  t: '#f0f0f0',
  t2: '#888888',
  t3: '#444444',
  bdr: 'rgba(255,255,255,0.08)',
  bg1: '#111111',
  bg2: '#1a1a1a',
  grn: '#22c55e',
  pur: '#a855f7',
  blu: '#3b82f6',
  cyn: '#06b6d4',
}

function PixelGrid() {
  // 8x4 grid of small colored squares with shifting animation
  const pixels = []
  const colors = [D.blu, D.pur, D.cyn, D.grn]
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      const idx = (r * 8 + c) % colors.length
      pixels.push(
        <div
          key={`${r}-${c}`}
          style={{
            width: 6,
            height: 6,
            borderRadius: 1,
            opacity: ((r + c) % 3 === 0) ? 0.5 : 0.15,
            animation: `pixel-shift 8s ease-in-out ${(r * 0.3 + c * 0.2)}s infinite`,
          }}
          className="pixel-dot"
          data-color-idx={idx}
        />
      )
    }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 6px)', gap: 4, justifyContent: 'center' }}>
      {pixels}
    </div>
  )
}

interface WelcomeProps {
  onEnter: () => void
}

export default function Welcome({ onEnter }: WelcomeProps) {
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getKeys()
      .then((k) => setHasKey(!!k.mistral_api_key && k.mistral_api_key !== ''))
      .catch(() => setHasKey(false))
  }, [])

  const handleSave = async () => {
    if (!keyInput.trim()) return
    setSaving(true)
    try {
      await updateKeys({ mistral_api_key: keyInput })
      setSaved(true)
      setHasKey(true)
      setKeyInput('')
    } catch {
      // ignore
    }
    setSaving(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: D.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Logo */}
      <img
        src={logoUrl}
        alt="Alchemistral"
        style={{ width: 64, height: 64, marginBottom: 20, opacity: 0.9 }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 6,
          color: D.t,
          marginBottom: 12,
        }}
      >
        ALCHIMISTRAL
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 11,
          color: D.t2,
          marginBottom: 32,
          letterSpacing: 0.5,
        }}
      >
        You run one agent. Alchemistral runs a team.
      </div>

      {/* Pixel decoration */}
      <div style={{ marginBottom: 40 }}>
        <PixelGrid />
      </div>

      {/* API key or Enter */}
      {hasKey === null ? (
        <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, color: D.t3 }}>
          Connecting...
        </div>
      ) : hasKey ? (
        <button
          onClick={onEnter}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            background: 'transparent',
            border: `1px solid ${D.bdr}`,
            borderRadius: 6,
            color: D.t,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 1,
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = D.bdr
            e.currentTarget.style.background = 'transparent'
          }}
        >
          Enter Alchemistral <ArrowRight size={14} />
        </button>
      ) : (
        <div style={{ width: 400 }}>
          <div
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10,
              color: D.t2,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Paste your Mistral API key to start
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                placeholder="sk-..."
                style={{
                  width: '100%',
                  background: D.bg1,
                  border: `1px solid ${D.bdr}`,
                  borderRadius: 4,
                  padding: '10px 36px 10px 12px',
                  color: D.t,
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {showKey ? <EyeOff size={14} style={{ color: D.t3 }} /> : <Eye size={14} style={{ color: D.t3 }} />}
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !keyInput.trim()}
              style={{
                padding: '10px 20px',
                background: saved ? D.grn + '20' : D.bg2,
                border: `1px solid ${saved ? D.grn + '44' : D.bdr}`,
                borderRadius: 4,
                color: saved ? D.grn : D.t,
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                cursor: keyInput.trim() ? 'pointer' : 'default',
                opacity: keyInput.trim() ? 1 : 0.5,
              }}
            >
              {saving ? '...' : saved ? 'Saved' : 'Save'}
            </button>
          </div>
          {saved && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                onClick={onEnter}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  background: 'transparent',
                  border: `1px solid ${D.bdr}`,
                  borderRadius: 6,
                  color: D.t,
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Enter Alchemistral <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          fontFamily: "'Geist Mono', monospace",
          fontSize: 9,
          color: D.t3,
          letterSpacing: 0.5,
        }}
      >
        v0.1 &middot; Mistral Worldwide Hackathon 2026
      </div>
    </div>
  )
}
