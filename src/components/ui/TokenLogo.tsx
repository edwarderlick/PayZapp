/**
 * Token logo components with authentic brand designs.
 */

interface TokenLogoProps {
  symbol: string
  size?: number
  className?: string
}

/* ── USDC — Circle ring design ───────────────────────────── */
function UsdcLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      {/* 4-segment outer ring with 15° gaps at cardinal positions */}
      {/* Arc 1: 7.5° → 82.5° */}
      <path d="M 27.9 17.57 A 12 12 0 0 1 17.57 27.9" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* Arc 2: 97.5° → 172.5° */}
      <path d="M 14.43 27.9 A 12 12 0 0 1 4.1 17.57" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* Arc 3: 187.5° → 262.5° */}
      <path d="M 4.1 14.43 A 12 12 0 0 1 14.43 4.1" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* Arc 4: 277.5° → 352.5° */}
      <path d="M 17.57 4.1 A 12 12 0 0 1 27.9 14.43" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* Dollar sign */}
      <path d="M20.022 18.124c0-2.124-1.28-2.852-3.84-3.156-1.828-.234-2.194-.702-2.194-1.518s.586-1.346 1.756-1.346c1.054 0 1.64.352 1.934 1.23a.361.361 0 0 0 .34.234h.78a.33.33 0 0 0 .332-.338v-.052c-.22-1.2-1.202-2.1-2.452-2.22v-1.166a.346.346 0 0 0-.342-.342h-.74a.346.346 0 0 0-.342.342v1.13c-1.522.234-2.49 1.26-2.49 2.596 0 2.01 1.23 2.79 3.79 3.094 1.69.234 2.244.636 2.244 1.576 0 .938-.82 1.576-1.946 1.576-1.524 0-2.01-.638-2.186-1.524a.348.348 0 0 0-.342-.286h-.808a.33.33 0 0 0-.332.338v.052c.234 1.376 1.108 2.358 2.614 2.62v1.166c0 .19.152.342.342.342h.74a.346.346 0 0 0 .342-.342v-1.14c1.562-.26 2.6-1.35 2.6-2.666z" fill="white" />
    </svg>
  )
}

/* ── EURC — Same ring design as USDC, blue background ───── */
function EurcLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      {/* Same 4-segment outer ring as USDC */}
      <path d="M 27.9 17.57 A 12 12 0 0 1 17.57 27.9" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M 14.43 27.9 A 12 12 0 0 1 4.1 17.57" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M 4.1 14.43 A 12 12 0 0 1 14.43 4.1" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M 17.57 4.1 A 12 12 0 0 1 27.9 14.43" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* Euro sign */}
      <text x="16.5" y="21.5" textAnchor="middle" fontSize="15" fontWeight="900" fill="white" fontFamily="Arial, Helvetica, sans-serif">€</text>
    </svg>
  )
}

/* ── cirBTC / BTC — Bitcoin orange ───────────────────────── */
function BtcLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path d="M22.283 14.12c.284-1.9-1.163-2.92-3.142-3.6l.642-2.574-1.567-.39-.626 2.508a61.3 61.3 0 0 0-1.252-.31l.63-2.524L15.4 6.84l-.643 2.573c-.346-.079-.686-.156-1.015-.238l.002-.008-2.161-.54-.417 1.673s1.163.267 1.138.283c.635.158.749.578.73.91l-.731 2.927c.044.01.1.026.163.05l-.166-.04-1.024 4.108c-.078.193-.275.483-.718.373.016.023-1.14-.284-1.14-.284l-.778 1.793 2.039.508c.38.095.752.194 1.118.288l-.65 2.607 1.566.39.643-2.576c.428.116.844.223 1.25.323l-.64 2.566 1.566.39.65-2.601c2.675.507 4.687.302 5.534-2.118.682-1.944-.034-3.066-1.44-3.796.942-.217 1.65-.836 1.84-2.116zm-3.293 4.619c-.484 1.944-3.758.893-4.822.63l.86-3.448c1.064.265 4.476.79 3.962 2.818zm.486-4.64c-.442 1.773-3.17.872-4.055.651l.78-3.129c.885.22 3.734.632 3.275 2.479z" fill="white" />
    </svg>
  )
}

/* ── ETH ─────────────────────────────────────────────────── */
function EthLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#7B8CDE" />
      <path d="M16.498 5v9.87l7.497 3.35z" fill="white" fillOpacity="0.6" />
      <path d="M16.498 5L9 18.22l7.498-3.35z" fill="white" />
      <path d="M16.498 22.968v6.027L24 18.616z" fill="white" fillOpacity="0.6" />
      <path d="M16.498 28.995v-6.028L9 18.616z" fill="white" />
      <path d="M16.498 21.573l7.497-4.353-7.497-3.348z" fill="white" fillOpacity="0.2" />
      <path d="M9 17.22l7.498 4.353v-7.701z" fill="white" fillOpacity="0.6" />
    </svg>
  )
}

/* ── USDT ────────────────────────────────────────────────── */
function UsdtLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path d="M17.9 17.86v-.002c-.1.007-.618.038-1.77.038-1.15 0-1.633-.03-1.77-.038v.002c-3.14-.138-5.476-.68-5.476-1.335s2.336-1.197 5.476-1.337v2.13c.14.01.63.039 1.782.039 1.11 0 1.666-.03 1.758-.04v-2.128c3.14.14 5.476.682 5.476 1.337 0 .653-2.336 1.196-5.476 1.334zm0-2.893v-1.907h4.374V10H9.8v3.06h4.374v1.906c-3.56.163-6.227.866-6.227 1.71 0 .846 2.668 1.548 6.227 1.71v6.118h3.726v-6.119c3.556-.163 6.22-.864 6.22-1.71 0-.844-2.664-1.546-6.22-1.708z" fill="white" />
    </svg>
  )
}

const TOKEN_LOGO_MAP: Record<string, (size: number) => JSX.Element> = {
  USDC:   (s) => <UsdcLogo size={s} />,
  EURC:   (s) => <EurcLogo size={s} />,
  cirBTC: (s) => <BtcLogo size={s} />,
  BTC:    (s) => <BtcLogo size={s} />,
  ETH:    (s) => <EthLogo size={s} />,
  WETH:   (s) => <EthLogo size={s} />,
  USDT:   (s) => <UsdtLogo size={s} />,
}

const TOKEN_COLORS: Record<string, string> = {
  USDC:   '#2775CA',
  EURC:   '#2775CA',
  cirBTC: '#F7931A',
  BTC:    '#F7931A',
  ETH:    '#7B8CDE',
  WETH:   '#7B8CDE',
  USDT:   '#26A17B',
}

export function TokenLogo({ symbol, size = 32, className = '' }: TokenLogoProps) {
  const logoFn = TOKEN_LOGO_MAP[symbol]
  if (!logoFn) {
    const color = TOKEN_COLORS[symbol] ?? '#00D4AA'
    return (
      <div
        className={`rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 ${className}`}
        style={{ width: size, height: size, background: color }}
      >
        {symbol.charAt(0)}
      </div>
    )
  }
  return (
    <div className={`shrink-0 ${className}`} style={{ width: size, height: size }}>
      {logoFn(size)}
    </div>
  )
}
