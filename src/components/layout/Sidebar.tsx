import { NavLink } from 'react-router-dom'
import { Send, Users, ArrowRightLeft, Layers, Landmark, History, ExternalLink, Droplet } from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { path: '/send', icon: Send, label: 'Send' },
  { path: '/split', icon: Users, label: 'Split' },
  { path: '/swap', icon: ArrowRightLeft, label: 'Swap' },
  { path: '/bridge', icon: Layers, label: 'Bridge' },
  { path: '/vault', icon: Landmark, label: 'Vault' },
  { path: '/history', icon: History, label: 'History' },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-3xl h-[calc(100vh-73px)] p-6 hidden md:flex flex-col justify-between">
      <div className="space-y-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              'flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] uppercase tracking-[0.25em] font-bold transition-all duration-300 relative overflow-hidden border group',
              isActive
                ? 'text-white bg-[#00D4AA]/90 border-[#00D4AA]/30 shadow-[0_0_30px_rgba(108,92,231,0.35)] scale-[1.02]'
                : 'text-[rgba(255,255,255,0.4)] hover:text-[#00D4AA] hover:bg-white/[0.04] border-transparent'
            )}
          >
            <item.icon className="w-4.5 h-4.5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <span className="relative z-10">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="space-y-4 pt-6 border-t border-white/5">
        <a 
          href="https://testnet.arcscan.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors group p-2 rounded-xl hover:bg-white/5"
        >
          <span className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
            ArcScan Explorer
          </span>
        </a>
        <a 
          href="https://faucet.circle.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors group p-2 rounded-xl hover:bg-white/5"
        >
          <span className="flex items-center gap-3">
            <Droplet className="w-4 h-4 group-hover:scale-110 transition-transform text-blue-400/80" />
            USDC Faucet
          </span>
        </a>
      </div>
    </aside>
  )
}
