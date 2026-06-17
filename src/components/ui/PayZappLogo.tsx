/**
 * The PayZapp brand mark — an orbit ring with three connection nodes
 * (representing the unified cross-chain balance/network) cut through by a
 * bold lightning bolt (representing instant settlement). Teal -> blue ->
 * violet gradient, matching the app's established accent colors.
 */
export function PayZappLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} fill="none">
      <defs>
        <linearGradient id="pz-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F4F6FB" />
        </linearGradient>
        <linearGradient id="pz-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="pz-bolt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#pz-bg)" />

      {/* Orbit ring */}
      <circle cx="50" cy="50" r="33" stroke="url(#pz-ring)" strokeWidth="3.2" fill="none" />

      {/* Connection nodes */}
      <circle cx="19" cy="38" r="4.4" stroke="#2DD4BF" strokeWidth="2.6" fill="url(#pz-bg)" />
      <circle cx="83" cy="41" r="4.4" stroke="#3B82F6" strokeWidth="2.6" fill="url(#pz-bg)" />
      <circle cx="39" cy="82" r="4.4" stroke="#7C3AED" strokeWidth="2.6" fill="url(#pz-bg)" />

      {/* Bolt */}
      <path d="M61 9 L29 53 L48 53 L39 91 L72 47 L53 47 Z" fill="url(#pz-bolt)" />
    </svg>
  )
}
