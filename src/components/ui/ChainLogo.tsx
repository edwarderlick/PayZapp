/**
 * Real SVG chain logos — pixel-accurate brand marks.
 */

interface ChainLogoProps {
  chainId: string
  size?: number
  className?: string
}

/* ── Ethereum ─────────────────────────────────────────────── */
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

/* ── Arbitrum ─────────────────────────────────────────────── */
function ArbLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Outer hex fill (light border) */}
      <path d="M16 1.5L28.8 8.75V23.25L16 30.5L3.2 23.25V8.75Z" fill="#96BEDC" />
      {/* Inner hex (dark navy) */}
      <path d="M16 3.5L27.1 9.9V22.1L16 28.5L4.9 22.1V9.9Z" fill="#12263A" />
      {/* White slash 1 */}
      <line x1="9" y1="23" x2="12.8" y2="9" stroke="white" strokeWidth="2.3" strokeLinecap="round" />
      {/* White slash 2 */}
      <line x1="13.2" y1="23" x2="17" y2="9" stroke="white" strokeWidth="2.3" strokeLinecap="round" />
      {/* Blue A */}
      <path d="M18.5 23L22 9.5L25.5 23" stroke="#28A0F0" strokeWidth="2.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="19.8" y1="19.2" x2="24.2" y2="19.2" stroke="#28A0F0" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  )
}

/* ── Base — official Coinbase Base coin path ──────────────── */
function BaseLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 111 111" fill="none">
      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
      {/* Official Base "C-coin" white mark */}
      <path
        d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6 85.359 0 54.921 0C26.0545 0 2.00467 22.0539 0 50.3917H72.8467V59.6416H3.44824e-07C2.00467 87.9748 26.0545 110.034 54.921 110.034Z"
        fill="white"
      />
    </svg>
  )
}

/* ── Optimism ─────────────────────────────────────────────── */
function OpLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#FF0420" />
      <text
        x="16" y="21.5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fill="white"
        fontFamily="Arial Black, Arial, sans-serif"
        letterSpacing="-0.5"
      >OP</text>
    </svg>
  )
}

/* ── Avalanche ────────────────────────────────────────────── */
function AvaxLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#E84142" />
      {/* A triangle with notch */}
      <path d="M16 8L24.5 23.5H7.5L16 8Z" fill="white" />
      <path d="M16 14L19 19.5H13L16 14Z" fill="#E84142" />
    </svg>
  )
}

/* ── Polygon ──────────────────────────────────────────────── */
function PolygonLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <radialGradient id="pol-bg" cx="40%" cy="28%" r="75%">
          <stop offset="0%" stopColor="white" stopOpacity="0.85" />
          <stop offset="30%" stopColor="#A8B8FF" />
          <stop offset="65%" stopColor="#6675F7" />
          <stop offset="100%" stopColor="#2A35D0" />
        </radialGradient>
        <radialGradient id="pol-shine" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <clipPath id="pol-clip">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <circle cx="16" cy="16" r="16" fill="url(#pol-bg)" />
      {/* Reflection highlight */}
      <ellipse cx="14" cy="11" rx="9" ry="6" fill="url(#pol-shine)" clipPath="url(#pol-clip)" />
      {/* Horizon line effect */}
      <rect x="0" y="17" width="32" height="15" fill="rgba(0,0,80,0.15)" clipPath="url(#pol-clip)" />
    </svg>
  )
}

/* ── Arc Testnet — dark navy + white upward arch ─────────── */
function ArcLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0C1929" />
      {/*
        Arch gateway: two vertical pillars at x=10 and x=22,
        from y=26 (bottom) up to y=17 (pillar tops).
        Then a semicircle arcing UPWARD (sweep=1 = CW in screen coords)
        from (10,17) through (16,10) to (22,17).
        sweep=1 ensures the arc curves above the pillar tops, not below.
      */}
      <path
        d="M 10 26 L 10 17 A 6 6 0 0 1 22 17 L 22 26"
        stroke="white"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </svg>
  )
}

/* ── Ethereum Sepolia ─────────────────────────────────────── */
function EthSepoliaLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#7B8CDE" />
      <path d="M16.498 5v9.87l7.497 3.35z" fill="white" fillOpacity="0.6" />
      <path d="M16.498 5L9 18.22l7.498-3.35z" fill="white" />
      <path d="M16.498 22.968v6.027L24 18.616z" fill="white" fillOpacity="0.6" />
      <path d="M16.498 28.995v-6.028L9 18.616z" fill="white" />
      <path d="M16.498 21.573l7.497-4.353-7.497-3.348z" fill="white" fillOpacity="0.2" />
      <path d="M9 17.22l7.498 4.353v-7.701z" fill="white" fillOpacity="0.6" />
      {/* Testnet badge */}
      <circle cx="24" cy="24" r="6" fill="#1a1a2e" />
      <circle cx="24" cy="24" r="4.5" fill="#f97316" />
      <text x="24" y="27" textAnchor="middle" fontSize="5.5" fill="white" fontWeight="bold" fontFamily="Arial, sans-serif">S</text>
    </svg>
  )
}

const CHAIN_LOGO_MAP: Record<string, (size: number) => JSX.Element> = {
  Arc_Testnet:      (s) => <ArcLogo size={s} />,
  Ethereum_Sepolia: (s) => <EthSepoliaLogo size={s} />,
  Arbitrum_Sepolia: (s) => <ArbLogo size={s} />,
  Base_Sepolia:     (s) => <BaseLogo size={s} />,
  Optimism_Sepolia: (s) => <OpLogo size={s} />,
  Avalanche_Fuji:   (s) => <AvaxLogo size={s} />,
  Polygon_Amoy:     (s) => <PolygonLogo size={s} />,
  // By numeric chain id
  '5042002':   (s) => <ArcLogo size={s} />,
  '11155111':  (s) => <EthSepoliaLogo size={s} />,
  '421614':    (s) => <ArbLogo size={s} />,
  '84532':     (s) => <BaseLogo size={s} />,
  '11155420':  (s) => <OpLogo size={s} />,
  '43113':     (s) => <AvaxLogo size={s} />,
  '80002':     (s) => <PolygonLogo size={s} />,
}

export function ChainLogo({ chainId, size = 32, className = '' }: ChainLogoProps) {
  const logoFn = CHAIN_LOGO_MAP[chainId]
  if (!logoFn) {
    return (
      <div
        className={`rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 ${className}`}
        style={{ width: size, height: size, background: 'rgba(255,255,255,0.1)' }}
      >
        ?
      </div>
    )
  }
  return (
    <div className={`shrink-0 ${className}`} style={{ width: size, height: size }}>
      {logoFn(size)}
    </div>
  )
}

export const CHAIN_LABELS: Record<string, string> = {
  Arc_Testnet:      'Arc Testnet',
  Ethereum_Sepolia: 'Ethereum',
  Arbitrum_Sepolia: 'Arbitrum',
  Base_Sepolia:     'Base',
  Optimism_Sepolia: 'Optimism',
  Avalanche_Fuji:   'Avalanche',
  Polygon_Amoy:     'Polygon',
}

export const CHAIN_SHORT: Record<string, string> = {
  Arc_Testnet:      'ARC',
  Ethereum_Sepolia: 'ETH',
  Arbitrum_Sepolia: 'ARB',
  Base_Sepolia:     'BASE',
  Optimism_Sepolia: 'OP',
  Avalanche_Fuji:   'AVAX',
  Polygon_Amoy:     'POL',
}
