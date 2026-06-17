import { type ClassValue } from 'clsx'

const CHAIN_COLORS: Record<string, string> = {
  'Arc Testnet': '#00D4AA',
  'Ethereum Sepolia': '#627EEA',
  'Base Sepolia': '#0052FF',
  'Arbitrum Sepolia': '#28A0F0',
  'Polygon Amoy': '#8247E5',
  'Avalanche Fuji': '#E84142',
  'Optimism Sepolia': '#FF0420',
}

export function ChainBadge({ name }: { name: string }) {
  const color = CHAIN_COLORS[name] || '#A7F3D0'
  return (
    <div className="flex items-center gap-3 bg-black/60 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-3 w-fit shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] transition-all duration-300">
      <div 
        className="w-3.5 h-3.5 rounded-full relative flex items-center justify-center shrink-0" 
      >
        <span className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="absolute w-full h-full rounded-full animate-pulse opacity-50" style={{ backgroundColor: color, filter: 'blur(3px)' }} />
      </div>
      <span className="text-[12px] uppercase tracking-[0.2em] font-extrabold text-white">{name}</span>
    </div>
  )
}
