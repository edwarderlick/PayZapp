import { NavLink } from 'react-router-dom'
import { Send, Users, ArrowRightLeft, Layers, History, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { path: '/send',    Icon: Send,            label: 'Send',    color: '#00D4AA' },
  { path: '/split',   Icon: Users,           label: 'Split',   color: '#00D4AA' },
  { path: '/swap',    Icon: ArrowRightLeft,  label: 'Swap',    color: '#00D4AA' },
  { path: '/bridge',  Icon: Layers,          label: 'Bridge',  color: '#5B67F3' },
  { path: '/vault',   Icon: LayoutDashboard, label: 'Vault',   color: '#F5A623' },
  { path: '/history', Icon: History,         label: 'History', color: '#00D4AA' },
]

export function MobileNav() {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 pb-safe z-30"
      style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(30px) saturate(1.5)',
        borderTop: '1px solid var(--border-subtle)',
        boxShadow: '0 -12px 50px rgba(0,212,170,0.08)',
      }}
    >
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#00D4AA]/20 to-transparent" />
      <div className="flex justify-around px-2 py-2">
        {NAV_ITEMS.map(({ path, Icon, label, color }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => clsx(
              'flex flex-col items-center gap-1 py-2 px-2.5 min-w-[44px] transition-all duration-300 rounded-2xl relative cursor-pointer',
              isActive ? '' : 'hover:text-[var(--text-primary)]'
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-bg"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                      boxShadow: `0 0 20px ${color}20`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}

                <motion.div
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                  className="relative z-10"
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isActive ? color : undefined }}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: color }}
                    />
                  )}
                </motion.div>

                <span
                  className="text-[9px] tracking-wide uppercase font-display font-bold relative z-10"
                  style={{ color: isActive ? color : undefined }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
