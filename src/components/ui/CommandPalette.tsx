import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import {
  Search, Send, Users, ArrowRightLeft, Layers, LayoutDashboard, History,
  Sun, Moon, Copy, ExternalLink, LogOut, Command as CommandIcon, CornerDownLeft,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

interface CommandAction {
  id: string
  label: string
  hint?: string
  Icon: typeof Send
  keywords: string
  run: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

export function CommandPalette({ isOpen, onOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { theme, toggleTheme } = useTheme()

  const close = useCallback(() => {
    onClose()
    setQuery('')
    setActiveIndex(0)
  }, [onClose])

  // Global Cmd+K / Ctrl+K toggle, available from anywhere in the shell
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        isOpen ? close() : onOpen()
      }
      if (e.key === 'Escape' && isOpen) close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onOpen, close])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const actions: CommandAction[] = useMemo(() => [
    { id: 'send',    label: 'Go to Send',    Icon: Send,            keywords: 'send transfer pay',     run: () => navigate('/send') },
    { id: 'split',   label: 'Go to Split',   Icon: Users,           keywords: 'split bills room group', run: () => navigate('/split') },
    { id: 'swap',    label: 'Go to Swap',    Icon: ArrowRightLeft,  keywords: 'swap trade exchange',   run: () => navigate('/swap') },
    { id: 'bridge',  label: 'Go to Bridge',  Icon: Layers,          keywords: 'bridge cctp crosschain', run: () => navigate('/bridge') },
    { id: 'vault',   label: 'Go to Vault',   Icon: LayoutDashboard, keywords: 'vault deposit unified balance', run: () => navigate('/vault') },
    { id: 'history', label: 'Go to History', Icon: History,         keywords: 'history transactions ledger', run: () => navigate('/history') },
    {
      id: 'theme', label: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      Icon: theme === 'dark' ? Sun : Moon, keywords: 'theme dark light mode appearance', run: toggleTheme,
    },
    ...(address ? [
      {
        id: 'copy', label: 'Copy Wallet Address', hint: `${address.slice(0, 6)}…${address.slice(-4)}`,
        Icon: Copy, keywords: 'copy address wallet clipboard',
        run: () => { navigator.clipboard.writeText(address) },
      },
      {
        id: 'explorer', label: 'View on Arc Explorer', Icon: ExternalLink, keywords: 'explorer arcscan view',
        run: () => { window.open(`https://testnet.arcscan.app/address/${address}`, '_blank') },
      },
      {
        id: 'disconnect', label: 'Disconnect Wallet', Icon: LogOut, keywords: 'disconnect logout signout',
        run: () => disconnect(),
      },
    ] : []),
  ], [navigate, theme, toggleTheme, address, disconnect])

  const filtered = useMemo(() => {
    if (!query.trim()) return actions
    const q = query.toLowerCase()
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.keywords.includes(q))
  }, [actions, query])

  useEffect(() => setActiveIndex(0), [query])

  const runAction = (action: CommandAction) => {
    action.run()
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) runAction(filtered[activeIndex])
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[91] left-1/2 top-[14vh] -translate-x-1/2 w-[min(520px,92vw)] rounded-2xl overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
            }}
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00D4AA]/50 to-transparent" />

            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search actions or pages..."
                className="flex-1 bg-transparent outline-none text-sm font-ui"
                style={{ color: 'var(--text-primary)' }}
              />
              <kbd className="text-[10px] font-number px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                ESC
              </kbd>
            </div>

            <div className="max-h-[340px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No matching actions
                </div>
              ) : (
                filtered.map((action, i) => (
                  <button
                    key={action.id}
                    onClick={() => runAction(action)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer"
                    style={i === activeIndex ? { background: 'rgba(0,212,170,0.10)' } : {}}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <action.Icon className="w-4 h-4" style={{ color: i === activeIndex ? '#00D4AA' : 'var(--text-secondary)' }} />
                    </div>
                    <span className="flex-1 text-sm font-ui font-medium" style={{ color: 'var(--text-primary)' }}>
                      {action.label}
                    </span>
                    {action.hint && (
                      <span className="text-xs font-number" style={{ color: 'var(--text-muted)' }}>{action.hint}</span>
                    )}
                    {i === activeIndex && <CornerDownLeft className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2.5 text-[10px] font-ui" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>↵</kbd> Select</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/** Small hint badge for the TopBar showing the Cmd+K shortcut. */
export function CommandPaletteHint({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      title="Open command palette"
    >
      <CommandIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
      <kbd className="text-[10px] font-number" style={{ color: 'var(--text-muted)' }}>⌘K</kbd>
    </button>
  )
}
