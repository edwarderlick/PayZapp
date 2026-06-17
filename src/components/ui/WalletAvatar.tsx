/**
 * Procedurally generated wallet avatar — deterministic per-address "jazzicon"
 * style identicon (the same family of pattern used by MetaMask/Rainbow),
 * built from layered rotated gradient blobs instead of plain text initials.
 */

interface WalletAvatarProps {
  address: string
  size?: number
  className?: string
  animated?: boolean
}

// Deterministic 32-bit hash of the address — same input always produces the
// same avatar, so a wallet's "face" never changes across sessions.
function hashSeed(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// mulberry32 — tiny seeded PRNG, deterministic stream from a single seed.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h % 360)}, ${s}%, ${l}%)`
}

export function WalletAvatar({ address, size = 32, className = '', animated = true }: WalletAvatarProps) {
  const seed = hashSeed(address.toLowerCase())
  const rand = mulberry32(seed)

  const baseHue = rand() * 360
  // 4 overlapping blobs at increasing hue offsets — keeps every avatar
  // vibrant and harmonious (analogous palette) instead of muddy random colors.
  const blobs = Array.from({ length: 4 }, (_, i) => {
    const hue = baseHue + i * (35 + rand() * 25)
    const cx = 20 + rand() * 60
    const cy = 20 + rand() * 60
    const r = 28 + rand() * 26
    const sat = 70 + rand() * 20
    const light = 50 + rand() * 18
    return { hue, cx, cy, r, sat, light }
  })

  const gradId = `wa-grad-${seed}`
  const rotateDeg = (seed % 360) - 180

  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size, boxShadow: '0 0 0 1px rgba(255,255,255,0.12)' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={animated ? { transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' } : undefined}
        className={animated ? 'group-hover:scale-110' : ''}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={hsl(baseHue, 75, 45)} />
            <stop offset="100%" stopColor={hsl(baseHue + 60, 75, 30)} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${gradId})`} />
        <g style={{ transformOrigin: '50px 50px' }} transform={`rotate(${rotateDeg} 50 50)`}>
          {blobs.map((b, i) => (
            <circle
              key={i}
              cx={b.cx}
              cy={b.cy}
              r={b.r}
              fill={hsl(b.hue, b.sat, b.light)}
              opacity={0.85}
            />
          ))}
        </g>
        {/* Soft inner highlight for a glassy, premium finish */}
        <ellipse cx="35" cy="22" rx="30" ry="16" fill="white" opacity="0.12" />
      </svg>
    </div>
  )
}
