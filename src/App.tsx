import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Screen =
  | 'cover'
  | 'intro'
  | 'memory1'
  | 'memory2'
  | 'memory3'
  | 'present'
  | 'question'
  | 'no_confirm'
  | 'no_response'
  | 'yes_response'
  | 'dark_transition'
  | 'app_teaser'
  | 'future_features'
  | 'end'

// ── Constants ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toLocaleDateString('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  size: 1.5 + ((i * 7) % 4),
  top: (i * 37 + 5) % 90,
  left: (i * 53 + 7) % 92,
  delay: (i * 0.38) % 3.5,
  duration: 1.8 + ((i * 0.31) % 2.2),
}))

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  char: ['✦', '✧', '◆', '○', '✦', '◇'][i % 6],
  color: ['#F07B6F', '#9B7EC8', '#7EC8E3', '#F5C842', '#F09A5A', '#E8688A'][i % 6],
  left: 6 + ((i * 5.8) % 88),
  delay: (i * 0.11) % 1.0,
  duration: 2.6 + ((i * 0.19) % 1.6),
  rotation: i % 2 === 0 ? 380 : -380,
}))

const FUTURE_CARDS = [
  { emoji: '📸', label: 'Fotos' },
  { emoji: '📖', label: 'Historias' },
  { emoji: '💬', label: 'Frases' },
  { emoji: '🎵', label: 'Canciones' },
  { emoji: '📍', label: 'Lugares' },
  { emoji: '✨', label: 'Momentos' },
  { emoji: '❤️', label: 'Recuerdos' },
]

// Background configurations per screen
const BG: Record<
  string,
  { gradient: string; blobs: Array<{ color: string; size: number; top: string; left: string; delay: number }> }
> = {
  intro: {
    gradient: 'linear-gradient(140deg, #F7DCE8 0%, #E8DDF7 55%, #DDECF8 100%)',
    blobs: [
      { color: 'rgba(240,123,111,0.2)', size: 320, top: '-6%', left: '-12%', delay: 0 },
      { color: 'rgba(155,126,200,0.18)', size: 280, top: '62%', left: '68%', delay: 2.5 },
    ],
  },
  memory1: {
    gradient: 'linear-gradient(150deg, #DCEAF7 0%, #E8DDF7 45%, #F4DCEB 100%)',
    blobs: [
      { color: 'rgba(126,200,227,0.22)', size: 300, top: '-4%', left: '62%', delay: 1 },
      { color: 'rgba(155,126,200,0.16)', size: 260, top: '65%', left: '-8%', delay: 3 },
    ],
  },
  memory2: {
    gradient: 'linear-gradient(135deg, #E3DDF5 0%, #DDEAF4 50%, #F5DCE8 100%)',
    blobs: [
      { color: 'rgba(155,126,200,0.22)', size: 280, top: '2%', left: '-10%', delay: 0.5 },
      { color: 'rgba(126,200,227,0.18)', size: 310, top: '58%', left: '64%', delay: 2 },
    ],
  },
  memory3: {
    gradient: 'linear-gradient(155deg, #DDD4F2 0%, #E7D8F5 45%, #D9E8F6 100%)',
    blobs: [
      { color: 'rgba(155,126,200,0.24)', size: 340, top: '-8%', left: '55%', delay: 1.5 },
      { color: 'rgba(100,80,160,0.13)', size: 290, top: '62%', left: '-6%', delay: 0 },
    ],
  },
  present: {
    gradient: 'linear-gradient(135deg, #F8DFD8 0%, #EBDCF4 50%, #DCEAF8 100%)',
    blobs: [
      { color: 'rgba(240,154,90,0.18)', size: 310, top: '-4%', left: '58%', delay: 0 },
      { color: 'rgba(155,126,200,0.16)', size: 270, top: '66%', left: '-7%', delay: 2.2 },
    ],
  },
  question: {
    gradient: 'linear-gradient(135deg, #FFF8F1 0%, #F5E8F7 50%, #E8F3FA 100%)',
    blobs: [
      { color: 'rgba(240,123,111,0.1)', size: 380, top: '-10%', left: '-10%', delay: 1 },
      { color: 'rgba(126,200,227,0.1)', size: 320, top: '62%', left: '64%', delay: 3 },
    ],
  },
  no_response: {
    gradient: 'linear-gradient(135deg, #F1E8F8 0%, #E9F3F7 100%)',
    blobs: [{ color: 'rgba(155,126,200,0.12)', size: 320, top: '5%', left: '58%', delay: 0 }],
  },
  yes_response: {
    gradient: 'linear-gradient(135deg, #FFF0E8 0%, #F5E8F5 40%, #E8EEFF 100%)',
    blobs: [
      { color: 'rgba(240,123,111,0.28)', size: 380, top: '-10%', left: '-6%', delay: 0 },
      { color: 'rgba(245,200,66,0.22)', size: 300, top: '52%', left: '60%', delay: 1.5 },
      { color: 'rgba(155,126,200,0.2)', size: 270, top: '-4%', left: '62%', delay: 3 },
    ],
  },
}

// ── Small atoms ────────────────────────────────────────────────────────────────

function PageNumber({ n }: { n: string }) {
  return (
    <span className="font-serif-display text-[10px] tracking-[0.28em] text-stone-400/60 select-none uppercase">
      {n}
    </span>
  )
}

function NavArrow({ onClick, delay = '0s', label = 'siguiente' }: {
  onClick: () => void
  delay?: string
  label?: string
}) {
  return (
    <div className="flex justify-end mt-auto pt-5 reveal" style={{ animationDelay: delay }}>
      <button
        onClick={onClick}
        className="group flex items-center gap-2 text-stone-400 hover:text-stone-600 active:scale-95 transition-all select-none"
      >
        <span className="text-[9px] font-light tracking-[0.22em] uppercase opacity-60 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
        <span className="text-sm group-hover:translate-x-1 transition-transform duration-200">→</span>
      </button>
    </div>
  )
}

function AmbientBlobs({ blobs }: {
  blobs: Array<{ color: string; size: number; top: string; left: string; delay: number }>
}) {
  return (
    <>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: b.color,
            filter: 'blur(72px)',
            animation: `float ${8 + b.delay * 0.6}s ease-in-out ${b.delay}s infinite`,
          }}
        />
      ))}
    </>
  )
}

// ── SVG atoms ──────────────────────────────────────────────────────────────────

function MoonSVG({ size = 28, color = 'rgba(200,210,250,0.6)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 4C10.5 4 5 9 5 16s5.5 12 12 12c2 0 4-.5 5.5-1.5-3.5-1-6-4-6-8.5s2.5-7.5 6-8.5C21 6.5 18.5 4 16 4z"
        fill={color}
      />
    </svg>
  )
}

function ControllerSVG() {
  return (
    <svg width="46" height="30" viewBox="0 0 46 30" fill="none">
      <rect x="2" y="8" width="42" height="17" rx="8.5" stroke="rgba(155,126,200,0.4)" strokeWidth="1.5" />
      <circle cx="14" cy="16.5" r="2.5" fill="rgba(155,126,200,0.38)" />
      <circle cx="32" cy="16.5" r="2.5" fill="rgba(155,126,200,0.38)" />
      <rect x="20.5" y="13" width="5" height="2" rx="1" fill="rgba(155,126,200,0.38)" />
      <rect x="22.5" y="11" width="2" height="6" rx="1" fill="rgba(155,126,200,0.38)" />
    </svg>
  )
}

function ClockSVG({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <circle cx="17" cy="17" r="14" stroke="rgba(155,126,200,0.35)" strokeWidth="1.5" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <line
          key={i}
          x1="17" y1="5"
          x2="17" y2={i % 3 === 0 ? '7' : '6'}
          stroke="rgba(155,126,200,0.22)"
          strokeWidth="1"
          transform={`rotate(${deg} 17 17)`}
        />
      ))}
      {/* Minute hand → 12 */}
      <line x1="17" y1="17" x2="17" y2="7" stroke="rgba(155,126,200,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Hour hand → 6 */}
      <line x1="17" y1="17" x2="17" y2="24" stroke="rgba(155,126,200,0.65)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="2" fill="rgba(155,126,200,0.45)" />
    </svg>
  )
}

// ── BookLayout ─────────────────────────────────────────────────────────────────

function BookLayout({
  screen,
  isExiting,
  pageKey,
  children,
}: {
  screen: Screen
  isExiting: boolean
  pageKey: number
  children: React.ReactNode
}) {
  const cfg = BG[screen] ?? BG.intro

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden relative"
      style={{ background: cfg.gradient }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AmbientBlobs blobs={cfg.blobs} />
      </div>

      <div className={`relative z-10 w-full max-w-[390px] sm:max-w-[440px] md:max-w-[520px] ${isExiting ? 'page-exit' : ''}`}>
        <div
          key={pageKey}
          className="page-enter paper-page rounded-[20px] overflow-hidden"
          style={{
            boxShadow:
              '0 2px 4px rgba(80,40,80,0.06), 0 8px 24px rgba(80,40,80,0.1), 0 28px 72px rgba(80,40,80,0.13)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Cover ──────────────────────────────────────────────────────────────────────

function CoverScreen({ onOpen, exiting }: { onOpen: () => void; exiting: boolean }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden select-none"
      style={{ background: 'linear-gradient(148deg, #1E0A3C 0%, #0D051C 55%, #1A0A30 100%)' }}
    >
      {STARS.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            width: s.size,
            height: s.size,
            top: `${s.top}%`,
            left: `${s.left}%`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full" style={{ width: 420, height: 420, top: '-12%', left: '-6%', background: 'rgba(155,126,200,0.11)', filter: 'blur(80px)', animation: 'float 11s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: '58%', left: '58%', background: 'rgba(240,123,111,0.09)', filter: 'blur(80px)', animation: 'float 13s ease-in-out 3s infinite' }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, top: '32%', left: '42%', background: 'rgba(126,200,227,0.07)', filter: 'blur(60px)', animation: 'float 9.5s ease-in-out 1.5s infinite' }} />
      </div>

      <div
        className={`relative z-10 w-full max-w-[340px] sm:max-w-[380px] mx-auto px-4 ${exiting ? 'cover-exit' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="paper-page rounded-[20px] overflow-hidden"
          style={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.45), 0 20px 56px rgba(0,0,0,0.55), 0 48px 96px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Gradient top band */}
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #F07B6F 0%, #9B7EC8 50%, #7EC8E3 100%)' }}
          />

          <div className="px-8 sm:px-10 py-10 sm:py-12 flex flex-col items-center gap-7 min-h-[440px] justify-center relative">
            <div
              className="font-script text-stone-400/45 text-sm tracking-widest"
              style={{ animation: 'fadeIn 0.8s ease 0.2s both' }}
            >
              para ti
            </div>

            <div className="text-center" style={{ animation: 'fadeUp 0.8s ease 0.4s both' }}>
              <h1 className="font-serif-display text-[1.65rem] sm:text-3xl text-stone-700 italic leading-[1.3]">
                Tengo algo<br />que enseñarte.
              </h1>
            </div>

            <div className="flex items-center gap-3 w-full opacity-30">
              <div className="h-px flex-1 bg-stone-500" />
              <span className="text-stone-500 text-xs">✦</span>
              <div className="h-px flex-1 bg-stone-500" />
            </div>

            <p
              className="text-stone-600/90 text-sm text-center leading-relaxed"
              style={{ animation: 'fadeUp 0.8s ease 0.7s both' }}
            >
              Ábrelo cuando estés preparada.
            </p>

            <button
              onClick={onOpen}
              className="mt-2 px-10 py-3 rounded-full text-sm font-medium tracking-[0.22em] uppercase transition-all active:scale-95 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #F07B6F 0%, #9B7EC8 100%)',
                color: 'white',
                boxShadow: '0 4px 22px rgba(155,126,200,0.45)',
                animation: 'fadeUp 0.8s ease 1.1s both',
              }}
            >
              Abrir
            </button>

            <div className="absolute bottom-5 right-8">
              <PageNumber n="00" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Intro ──────────────────────────────────────────────────────────────────────

function IntroScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative p-8 sm:p-10 flex flex-col min-h-[500px]">
      <div className="flex justify-between items-center mb-8">
        <span className="font-script text-stone-400/45 text-sm">un álbum</span>
        <PageNumber n="01" />
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <p
          className="font-serif-display text-xl sm:text-2xl text-stone-700 italic leading-relaxed reveal"
          style={{ animationDelay: '0.15s' }}
        >
          "Espero que leas esto<br />detenidamente."
        </p>

        <div
          className="flex items-center gap-2 reveal"
          style={{ animationDelay: '0.4s', color: '#F07B6F' }}
        >
          <div className="h-px w-12 bg-current opacity-40" />
          <div className="w-1 h-1 rounded-full bg-current opacity-50" />
        </div>

        <p
          className="text-stone-600 text-base leading-relaxed reveal"
          style={{ animationDelay: '0.65s' }}
        >
          Primero de todo, hoy estás preciosa.
        </p>

        <p
          className="text-stone-600 text-sm sm:text-base leading-relaxed reveal"
          style={{ animationDelay: '0.9s' }}
        >
          Le he dedicado una parte de mi tiempo a hacer esto
          y espero de verdad que te guste.
        </p>
      </div>

      <NavArrow onClick={onNext} delay="1.2s" />
    </div>
  )
}

// ── Memory 1: 04/07 ────────────────────────────────────────────────────────────

function Memory1Screen({ onNext }: { onNext: () => void }) {
  const stars = [
    { size: 3, top: 0, left: 22, delay: 0 },
    { size: 5, top: 14, left: 2, delay: 0.7 },
    { size: 2, top: 7, left: 38, delay: 1.4 },
    { size: 4, top: 24, left: 16, delay: 0.3 },
    { size: 2, top: 2, left: 48, delay: 1.0 },
  ]

  return (
    <div className="relative p-8 sm:p-10 flex flex-col min-h-[540px] overflow-hidden">
      <div className="absolute top-5 right-6 pointer-events-none select-none w-14 h-12">
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: s.size,
              height: s.size,
              top: s.top,
              left: s.left,
              background: 'rgba(126,200,227,0.7)',
              animation: `twinkle 2.2s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mb-5">
        <div />
        <PageNumber n="02" />
      </div>

      <div
        className="reveal font-serif-display leading-none select-none pointer-events-none"
        style={{
          animationDelay: '0.1s',
          fontSize: 'clamp(2rem, 10vw, 3.2rem)',
          color: 'rgba(126,200,227,0.22)',
          letterSpacing: '-0.02em',
        }}
      >
        04/07/2026
      </div>

      <h2
        className="font-serif-display text-lg sm:text-xl text-stone-700 italic reveal mt-1"
        style={{ animationDelay: '0.35s' }}
      >
        La primera vez que hablamos
      </h2>

      <div
        className="h-px w-10 my-4 reveal"
        style={{ animationDelay: '0.5s', background: 'rgba(126,200,227,0.5)' }}
      />

      <p
        className="text-stone-600 text-sm sm:text-base leading-relaxed reveal"
        style={{ animationDelay: '0.7s' }}
      >
        Me acuerdo de que quedamos para jugar al Valorant y terminamos
        pasando toda la noche en llamada.
      </p>

      <div
        className="flex items-end gap-4 mt-auto pt-5 mb-1 reveal"
        style={{ animationDelay: '1s' }}
      >
        <MoonSVG />
        <ControllerSVG />
        <div className="ml-auto flex gap-1.5 items-end pb-0.5">
          {[8, 13, 6, 11, 8].map((h, i) => (
            <div key={i} className="w-[3px] rounded-full" style={{ height: h, background: 'rgba(126,200,227,0.5)' }} />
          ))}
        </div>
      </div>

      <NavArrow onClick={onNext} delay="1.2s" />
    </div>
  )
}

// ── Memory 2: 11/07 ────────────────────────────────────────────────────────────

function Memory2Screen({ onNext }: { onNext: () => void }) {
  const bubbles = [
    { align: 'left', w: 72, color: 'rgba(155,126,200,0.2)', br: '4px 16px 16px 16px', delay: '0.65s' },
    { align: 'right', w: 56, color: 'rgba(126,200,227,0.22)', br: '16px 4px 16px 16px', delay: '0.85s' },
    { align: 'left', w: 84, color: 'rgba(155,126,200,0.18)', br: '4px 16px 16px 16px', delay: '1.05s' },
    { align: 'right', w: 62, color: 'rgba(240,123,111,0.18)', br: '16px 4px 16px 16px', delay: '1.25s' },
    { align: 'left', w: 46, color: 'rgba(155,126,200,0.22)', br: '4px 16px 16px 16px', delay: '1.45s' },
    { align: 'right', w: 70, color: 'rgba(126,200,227,0.18)', br: '16px 4px 16px 16px', delay: '1.65s' },
  ]

  return (
    <div className="relative p-8 sm:p-10 flex flex-col min-h-[540px] overflow-hidden">
      <div className="flex justify-between items-center mb-5">
        <div />
        <PageNumber n="03" />
      </div>

      <div
        className="reveal font-serif-display leading-none select-none pointer-events-none"
        style={{
          animationDelay: '0.1s',
          fontSize: 'clamp(2rem, 10vw, 3.2rem)',
          color: 'rgba(155,126,200,0.2)',
          letterSpacing: '-0.02em',
        }}
      >
        11/07/2026
      </div>

      <h2
        className="font-serif-display text-lg sm:text-xl text-stone-700 italic reveal mt-1"
        style={{ animationDelay: '0.35s' }}
      >
        La primera vez que hablamos<br />por WhatsApp
      </h2>

      <div
        className="h-px w-10 my-4 reveal"
        style={{ animationDelay: '0.5s', background: 'rgba(155,126,200,0.45)' }}
      />

      {/* Abstract chat visualization */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-3 w-full max-w-[260px]">
          {bubbles.map((b, i) => (
            <div key={i} className={`flex ${b.align === 'right' ? 'justify-end' : 'justify-start'} reveal`} style={{ animationDelay: b.delay }}>
              <div className="h-8" style={{ width: `${b.w}%`, background: b.color, borderRadius: b.br }} />
            </div>
          ))}
        </div>

        <p
          className="font-script text-stone-400/65 text-sm mt-4"
          style={{ animation: 'fadeUp 0.7s ease 1.85s both' }}
        >
          el principio de todo
        </p>
      </div>

      <NavArrow onClick={onNext} delay="2s" />
    </div>
  )
}

// ── Memory 3: 13/07 ────────────────────────────────────────────────────────────

function Memory3Screen({ onNext }: { onNext: () => void }) {
  const nStars = [
    { s: 2, t: 9, l: 12, d: 0 }, { s: 3, t: 18, l: 86, d: 1 },
    { s: 2, t: 5, l: 66, d: 0.5 }, { s: 4, t: 27, l: 92, d: 1.8 },
    { s: 2, t: 15, l: 74, d: 0.9 }, { s: 3, t: 4, l: 80, d: 1.3 },
    { s: 2, t: 34, l: 24, d: 1.7 }, { s: 2, t: 42, l: 94, d: 0.8 },
  ]

  return (
    <div
      className="relative flex flex-col min-h-[620px] overflow-hidden"
      style={{ background: 'linear-gradient(155deg, #17133D 0%, #21164B 52%, #0E1738 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-24 w-72 h-72 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-sky-400/10 blur-3xl" />
        {nStars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: s.s,
              height: s.s,
              top: `${s.t}%`,
              left: `${s.l}%`,
              animation: `twinkle 2.5s ease-in-out ${s.d}s infinite`,
              opacity: 0.65,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-8 sm:p-10 flex flex-col min-h-[620px]">
        <div className="flex justify-between items-center mb-5">
          <span
            className="font-serif-display text-[10px] tracking-[0.28em] uppercase text-white/40"
            style={{ animation: 'fadeIn 0.7s ease both' }}
          >
            Una noche cualquiera
          </span>
          <span className="font-serif-display text-[10px] tracking-[0.28em] text-white/40">04</span>
        </div>

        <div
          className="font-serif-display leading-none select-none"
          style={{
            animation: 'fadeUp 0.7s ease 0.1s both',
            fontSize: 'clamp(2.2rem, 11vw, 3.4rem)',
            color: 'rgba(255,255,255,0.13)',
            letterSpacing: '-0.02em',
          }}
        >
          13/07/2026
        </div>

        <div className="flex items-center gap-3 mt-2" style={{ animation: 'fadeUp 0.7s ease 0.25s both' }}>
          <MoonSVG size={27} color="rgba(232,220,255,0.82)" />
          <h2 className="font-serif-display text-xl sm:text-2xl text-white italic">
            Una noche que se nos hizo de día
          </h2>
        </div>

        <div
          className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl"
          style={{ animation: 'fadeUp 0.7s ease 0.45s both' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[9px] uppercase tracking-[0.28em] text-white/40">Hora</p>
              <p className="font-serif-display text-4xl text-white mt-1">06:00</p>
            </div>
            <ClockSVG size={54} color="rgba(232,220,255,0.78)" />
          </div>

          <div className="space-y-3.5 text-sm sm:text-[15px] leading-relaxed">
            <p className="text-white/72">
              Nos quedamos hablando hasta las 6 de la mañana. Yo, como de costumbre, soltando cualquier bobada que se me pasaba por la cabeza, y tú riéndote de ellas.
            </p>

            <p className="text-white/72">
              En algún momento de la noche me dio por preguntarte si tendrías una cita con un jugador de Brawl Stars.
            </p>

            <p className="text-white/72">
              Tú dijiste que dependía.
            </p>

            <p className="text-white/72">
              Y de una cosa pasamos a otra, hasta que terminamos hablando de Mang y me dijiste que era muy guapo.
            </p>
          </div>
        </div>

        <p
          className="font-serif-display text-base sm:text-lg text-white/82 italic leading-relaxed mt-5"
          style={{ animation: 'fadeUp 0.8s ease 1s both' }}
        >
          Supongo que, visto desde fuera, puede parecer una conversación cualquiera.
          <br />
          Pero yo me acuerdo de aquella noche.
        </p>

        <NavArrow
          onClick={onNext}
          delay="1.25s"
          label="seguir"
        />
      </div>
    </div>
  )
}

// ── Present ────────────────────────────────────────────────────────────────────

function PresentScreen({ onNext }: { onNext: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1900),
      setTimeout(() => setStep(3), 3500),
      setTimeout(() => setStep(4), 5200),
      setTimeout(() => setStep(5), 6800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const show = (n: number) => ({
    opacity: step >= n ? 1 : 0,
    transform: step >= n ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.8s ease, transform 0.8s ease',
  })

  return (
    <div className="relative p-8 sm:p-10 flex flex-col min-h-[520px]">
      <div className="flex justify-end mb-8">
        <PageNumber n="05" />
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <p className="font-serif-display text-2xl sm:text-3xl text-stone-700 italic" style={show(1)}>
          Y ahora estamos aquí.
        </p>

        <p
          className="font-serif-display text-3xl sm:text-4xl font-light"
          style={{ ...show(2), color: 'rgba(240,123,111,0.78)' }}
        >
          {TODAY}
        </p>

        <p className="text-stone-600 text-sm sm:text-base leading-relaxed" style={show(3)}>
          Después de todas esas conversaciones,<br />
          todas esas noches<br />
          y todas esas pequeñas cosas…
        </p>

        <p className="font-serif-display text-lg text-stone-700 italic" style={show(4)}>
          tengo una pregunta que hacerte.
        </p>

        <div style={show(5)} className="mt-2">
          <button
            onClick={onNext}
            className="px-9 py-3 rounded-full text-sm tracking-[0.18em] uppercase transition-all active:scale-95 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #F07B6F 0%, #9B7EC8 100%)',
              color: 'white',
              boxShadow: '0 4px 18px rgba(155,126,200,0.38)',
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Question ───────────────────────────────────────────────────────────────────

function QuestionScreen({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  const [confirmingNo, setConfirmingNo] = useState(false)

  if (confirmingNo) {
    return (
      <div className="relative p-8 sm:p-10 flex flex-col items-center min-h-[480px]">
        <div className="flex justify-end w-full mb-6">
          <PageNumber n="06" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center max-w-sm">
          <div className="text-3xl reveal" style={{ animationDelay: '0.15s' }}>♡</div>

          <p
            className="font-serif-display text-2xl sm:text-3xl text-stone-700 italic leading-snug reveal"
            style={{ animationDelay: '0.3s' }}
          >
            ¿Seguro que quieres<br />elegir esta opción?
          </p>

          <p
            className="text-stone-600 text-sm leading-relaxed reveal"
            style={{ animationDelay: '0.55s' }}
          >
            No pasa nada si no estás segura. Puedes volver a la pregunta o terminar aquí.
          </p>

          <div className="flex flex-col gap-3 w-full max-w-[260px] mt-2 reveal" style={{ animationDelay: '0.8s' }}>
            <button
              onClick={() => setConfirmingNo(false)}
              className="w-full py-3.5 px-6 rounded-full text-sm font-medium tracking-wide transition-all active:scale-95 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #E96A82 0%, #8D63C7 100%)',
                color: 'white',
                boxShadow: '0 6px 22px rgba(141,99,199,0.3)',
              }}
            >
              Volver
            </button>

            <button
              onClick={onNo}
              className="w-full py-3.5 px-6 rounded-full text-sm font-medium tracking-wide border transition-all active:scale-95 hover:bg-stone-50"
              style={{ borderColor: '#C8BBD8', color: '#665A78' }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative p-8 sm:p-10 flex flex-col items-center min-h-[480px]">
      <div className="flex justify-end w-full mb-6">
        <PageNumber n="06" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
        <p
          className="font-serif-display text-2xl sm:text-3xl text-stone-800 italic leading-snug reveal"
          style={{ animationDelay: '0.2s' }}
        >
          ¿Quieres ser<br />mi novia?
        </p>

        <div className="flex items-center gap-3 opacity-50 reveal" style={{ animationDelay: '0.5s' }}>
          <div className="h-px w-16 bg-violet-500" />
          <span className="text-violet-500 text-xs">✦</span>
          <div className="h-px w-16 bg-violet-500" />
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[260px] reveal" style={{ animationDelay: '0.8s' }}>
          <button
            onClick={onYes}
            className="w-full py-3.5 px-6 rounded-full text-sm font-medium tracking-wide transition-all active:scale-95 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #E96A82 0%, #8D63C7 100%)',
              color: 'white',
              boxShadow: '0 6px 24px rgba(233,106,130,0.35)',
            }}
          >
            Sí ❤️
          </button>
          <button
            onClick={() => setConfirmingNo(true)}
            className="w-full py-3.5 px-6 rounded-full text-sm font-medium tracking-wide border transition-all active:scale-95 hover:bg-stone-50"
            style={{ borderColor: '#BFB1D2', color: '#665A78', background: 'rgba(255,255,255,0.5)' }}
          >
            No / Necesito pensarlo
          </button>
        </div>
      </div>
    </div>
  )
}

// ── No response ────────────────────────────────────────────────────────────────

function NoResponseScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="relative p-8 sm:p-10 flex flex-col items-center min-h-[400px]">
      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
        <p className="font-serif-display text-2xl text-stone-600 italic reveal" style={{ animationDelay: '0.2s' }}>
          Está bien.
        </p>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed reveal" style={{ animationDelay: '0.5s' }}>
          Gracias por haber llegado hasta aquí igualmente. ❤️
        </p>
        <button
          onClick={onRestart}
          className="mt-5 px-8 py-2.5 rounded-full text-sm tracking-wider uppercase border transition-all active:scale-95 hover:bg-stone-50 reveal"
          style={{ animationDelay: '0.85s', borderColor: 'rgba(190,178,210,0.5)', color: '#b0a8c0' }}
        >
          Volver a empezar
        </button>
      </div>
    </div>
  )
}

// ── Yes response ───────────────────────────────────────────────────────────────

function YesResponseScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative p-8 sm:p-10 flex flex-col items-center min-h-[520px] overflow-hidden">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none select-none"
          style={{
            bottom: '-5%',
            left: `${p.left}%`,
            color: p.color,
            fontSize: '13px',
            animation: `celebrationRise ${p.duration}s ease-out ${p.delay + 0.3}s both`,
            '--cr': `${p.rotation}deg`,
          } as React.CSSProperties}
        >
          {p.char}
        </div>
      ))}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div
          className="text-5xl select-none"
          style={{ animation: 'heartBeat 1.6s ease-in-out infinite' }}
        >
          ❤️
        </div>

        <p
          className="font-serif-display text-2xl sm:text-3xl text-stone-700 italic leading-snug reveal"
          style={{ animationDelay: '0.35s' }}
        >
          El comienzo de<br />nuestra historia
        </p>

        <p
          className="font-serif-display text-2xl sm:text-3xl font-light reveal"
          style={{ animationDelay: '0.65s', color: 'rgba(240,123,111,0.82)' }}
        >
          {TODAY}
        </p>

        <p className="text-stone-600 text-sm sm:text-base italic reveal" style={{ animationDelay: '0.95s' }}>
          El primer recuerdo de muchos.
        </p>

        <button
          onClick={onNext}
          className="mt-3 px-9 py-3 rounded-full text-sm tracking-[0.18em] uppercase transition-all active:scale-95 hover:scale-105 reveal"
          style={{
            animationDelay: '1.4s',
            background: 'linear-gradient(135deg, #F07B6F 0%, #9B7EC8 100%)',
            color: 'white',
            boxShadow: '0 4px 22px rgba(240,123,111,0.42)',
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

// ── Dark transition ─────────────────────────────────────────────────────────────

function DarkTransitionScreen() {
  const [show, setShow] = useState(false)
  useEffect(() => { setTimeout(() => setShow(true), 1200) }, [])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: '#06030F', animation: 'fadeIn 1s ease forwards' }}
    >
      <div
        className="w-2 h-2 rounded-full bg-white/15"
        style={{ animation: 'glow 2.5s ease-in-out infinite' }}
      />
      <p
        className="text-white/18 text-[10px] tracking-[0.35em] uppercase transition-all duration-1000"
        style={{ opacity: show ? 1 : 0 }}
      >
        ♪ cambio de música ♪
      </p>
    </div>
  )
}

// ── App teaser ─────────────────────────────────────────────────────────────────

function AppTeaserScreen({ onNext }: { onNext: () => void }) {
  const [step, setStep] = useState(0)

  const lines = [
    { text: 'Esta app no acaba aquí.', cls: 'font-serif-display text-xl sm:text-2xl italic text-white' },
    { text: 'Voy a seguir dedicándole tiempo para convertirla en una forma especial de guardar nuestros recuerdos.', cls: 'text-sm sm:text-base text-white/65 leading-relaxed' },
    { text: 'Una app donde los dos podamos subir fotos, historias, ocurrencias, frases y pequeños momentos.', cls: 'text-sm sm:text-base text-white/65 leading-relaxed' },
    { text: 'Y, sobre todo, convertir todas esas cosas en recuerdos que podamos volver a ver algún día.', cls: 'text-sm sm:text-base text-white/65 leading-relaxed' },
    { text: 'Todavía no está completa.', cls: 'font-serif-display text-lg sm:text-xl italic text-white/85' },
    { text: 'Cuando lo esté, te enseñaré cómo funciona.', cls: 'text-sm text-white/55' },
  ]

  useEffect(() => {
    const timers = lines.map((_, i) =>
      setTimeout(() => setStep(s => Math.max(s, i + 1)), 600 + i * 2500)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-8 py-12"
      style={{ background: '#06030F', animation: 'fadeIn 1.2s ease forwards' }}
    >
      <div className="max-w-sm sm:max-w-md space-y-7 text-center">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`${line.cls} transition-all duration-900`}
            style={{
              opacity: step > i ? 1 : 0,
              transform: step > i ? 'translateY(0)' : 'translateY(20px)',
              transitionDuration: '0.9s',
            }}
          >
            {line.text}
          </p>
        ))}

        <div
          className="pt-6 transition-all duration-700"
          style={{ opacity: step >= lines.length ? 1 : 0, transitionDuration: '0.8s' }}
        >
          <button
            onClick={onNext}
            className="px-8 py-2.5 rounded-full text-xs tracking-[0.25em] uppercase border border-white/18 text-white/50 hover:text-white/80 hover:border-white/38 transition-all active:scale-95"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Future features ────────────────────────────────────────────────────────────

function FutureFeaturesScreen({ onNext }: { onNext: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setStep(1), 300),
    ]
    FUTURE_CARDS.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(s => Math.max(s, i + 2)), 500 + i * 280))
    })
    timers.push(setTimeout(() => setStep(FUTURE_CARDS.length + 2), 500 + FUTURE_CARDS.length * 280 + 700))
    timers.push(setTimeout(() => setStep(FUTURE_CARDS.length + 3), 500 + FUTURE_CARDS.length * 280 + 1600))
    return () => timers.forEach(clearTimeout)
  }, [])

  const last = FUTURE_CARDS.length

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 py-12 gap-8"
      style={{ background: '#06030F', animation: 'fadeIn 0.8s ease forwards' }}
    >
      <p
        className="text-white/40 text-[10px] tracking-[0.3em] uppercase transition-all duration-700"
        style={{ opacity: step >= 1 ? 1 : 0 }}
      >
        en el futuro
      </p>

      <div className="flex flex-wrap justify-center gap-2.5 max-w-[340px] sm:max-w-[420px]">
        {FUTURE_CARDS.map((card, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white/65 text-sm transition-all duration-500"
            style={{
              opacity: step >= i + 2 ? 1 : 0,
              transform: step >= i + 2 ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.94)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <span style={{ fontSize: 14 }}>{card.emoji}</span>
            <span className="text-xs tracking-wide">{card.label}</span>
          </div>
        ))}
      </div>

      <p
        className="text-white/28 text-xs text-center max-w-[240px] transition-all duration-700"
        style={{ opacity: step >= last + 2 ? 1 : 0 }}
      >
        Pequeñas ideas de lo que podría llegar a ser.
      </p>

      <div
        className="transition-all duration-700"
        style={{ opacity: step >= last + 3 ? 1 : 0 }}
      >
        <button
          onClick={onNext}
          className="px-8 py-2.5 rounded-full text-xs tracking-[0.25em] uppercase border border-white/15 text-white/45 hover:text-white/75 hover:border-white/32 transition-all active:scale-95"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}

// ── End ────────────────────────────────────────────────────────────────────────

function EndScreen({ onRestart }: { onRestart: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 2300),
      setTimeout(() => setStep(3), 4200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const show = (n: number, dur = '1.2s') => ({
    opacity: step >= n ? 1 : 0,
    transform: step >= n ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity ${dur} ease, transform ${dur} ease`,
  })

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-8"
      style={{ background: '#06030F', animation: 'fadeIn 0.8s ease forwards' }}
    >
      <p
        className="font-serif-display text-3xl sm:text-4xl text-white italic"
        style={show(1, '1.4s')}
      >
        El principio.
      </p>

      <span className="text-xl" style={{ ...show(2, '1.6s'), display: 'block' }}>❤️</span>

      <div className="mt-10" style={show(3, '1s')}>
        <button
          onClick={onRestart}
          className="flex items-center gap-2.5 text-white/28 hover:text-white/65 text-[10px] tracking-[0.3em] uppercase transition-all active:scale-95"
        >
          <span>↻</span>
          <span>Volver a verlo</span>
        </button>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────

const BOOK_SCREENS: Screen[] = [
  'intro', 'memory1', 'memory2', 'memory3',
  'present', 'question', 'no_response', 'yes_response',
]

const DARK_SCREENS: Screen[] = [
  'dark_transition', 'app_teaser', 'future_features', 'end',
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('cover')
  const [isExiting, setIsExiting] = useState(false)
  const [isCoverExiting, setIsCoverExiting] = useState(false)
  const [pageKey, setPageKey] = useState(0)

  const navigate = useCallback((next: Screen, duration = 550) => {
    setIsExiting(true)
    setTimeout(() => {
      setScreen(next)
      setPageKey((k) => k + 1)
      setIsExiting(false)
    }, duration)
  }, [])

  const openBook = useCallback(() => {
    setIsCoverExiting(true)
    setTimeout(() => {
      setScreen('intro')
      setPageKey((k) => k + 1)
      setIsCoverExiting(false)
    }, 920)
  }, [])

  useEffect(() => {
    if (screen === 'dark_transition') {
      const t = setTimeout(() => navigate('app_teaser'), 3000)
      return () => clearTimeout(t)
    }
  }, [screen, navigate])

  if (screen === 'cover') {
    return <CoverScreen onOpen={openBook} exiting={isCoverExiting} />
  }

  if (DARK_SCREENS.includes(screen)) {
    return (
      <div
        key={`dark-${pageKey}`}
        className="transition-opacity duration-500"
        style={{ opacity: isExiting ? 0 : 1 }}
      >
        {screen === 'dark_transition' && <DarkTransitionScreen />}
        {screen === 'app_teaser' && <AppTeaserScreen onNext={() => navigate('future_features')} />}
        {screen === 'future_features' && <FutureFeaturesScreen onNext={() => navigate('end')} />}
        {screen === 'end' && <EndScreen onRestart={() => navigate('cover')} />}
      </div>
    )
  }

  return (
    <BookLayout screen={screen} isExiting={isExiting} pageKey={pageKey}>
      {screen === 'intro' && <IntroScreen onNext={() => navigate('memory1')} />}
      {screen === 'memory1' && <Memory1Screen onNext={() => navigate('memory2')} />}
      {screen === 'memory2' && <Memory2Screen onNext={() => navigate('memory3')} />}
      {screen === 'memory3' && <Memory3Screen onNext={() => navigate('present')} />}
      {screen === 'present' && <PresentScreen onNext={() => navigate('question')} />}
      {screen === 'question' && (
        <QuestionScreen
          onYes={() => navigate('yes_response')}
          onNo={() => navigate('no_response')}
        />
      )}
      {screen === 'no_response' && <NoResponseScreen onRestart={() => navigate('cover')} />}
      {screen === 'yes_response' && (
        <YesResponseScreen onNext={() => navigate('dark_transition', 850)} />
      )}
    </BookLayout>
  )
}
