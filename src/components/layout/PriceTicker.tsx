import { TrendingUp, TrendingDown } from 'lucide-react'
import { TokenLogo } from '../ui/TokenLogo'

const BASE_ITEMS = [
  { sym: 'USDC',    price: '$1.00',    change: '+0.01%', up: true  },
  { sym: 'EURC',    price: '$1.09',    change: '+0.12%', up: true  },
  { sym: 'cirBTC',  price: '$97,420',  change: '+2.34%', up: true  },
  { sym: 'USDT',    price: '$1.00',    change: '-0.01%', up: false },
  { sym: 'USDC',    price: '$1.00',    change: '+0.01%', up: true  },
  { sym: 'EURC',    price: '$1.09',    change: '+0.12%', up: true  },
  { sym: 'cirBTC',  price: '$97,420',  change: '+2.34%', up: true  },
  { sym: 'USDT',    price: '$1.00',    change: '-0.01%', up: false },
]

// Double for seamless infinite loop
const ITEMS = [...BASE_ITEMS, ...BASE_ITEMS]

function TickerItem({ sym, price, change, up }: { sym: string; price: string; change: string; up: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-5 select-none shrink-0">
      <TokenLogo symbol={sym} size={18} />
      <span className="text-[11px] font-bold text-white/60 tracking-wide">{sym}</span>
      <span className="text-[11px] font-mono font-bold text-white/90">{price}</span>
      <span
        className="flex items-center gap-0.5 text-[10px] font-bold"
        style={{ color: up ? '#4ade80' : '#f87171' }}
      >
        {up
          ? <TrendingUp className="w-2.5 h-2.5" />
          : <TrendingDown className="w-2.5 h-2.5" />
        }
        {change}
      </span>
      <span className="w-px h-3 bg-white/10 shrink-0 mx-1" />
    </div>
  )
}

export function PriceTicker() {
  return (
    <div
      className="w-full overflow-hidden relative"
      style={{
        background: 'var(--bg-ticker)',
        borderBottom: '1px solid var(--border-subtle)',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Left fade */}
      <div className="absolute left-0 top-0 h-full w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, var(--bg-ticker) 0%, transparent 100%)' }} />

      {/* Live dot */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#00D4AA' }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#00D4AA' }} />
        </span>
        <span className="text-[9px] font-ui font-semibold uppercase tracking-widest" style={{ color: '#00D4AA' }}>Live</span>
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 h-full w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(270deg, var(--bg-ticker) 0%, transparent 100%)' }} />

      {/* Scrolling track */}
      <div className="ticker-track" style={{ paddingLeft: '80px' }}>
        {ITEMS.map((item, i) => (
          <TickerItem key={i} {...item} />
        ))}
      </div>
    </div>
  )
}
