import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Check } from 'lucide-react'
import { ChainLogo, CHAIN_LABELS } from './ChainLogo'

export interface ChainOption {
  id: string
  label: string
  balance?: string | null
  balanceLoading?: boolean
}

interface ChainSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (id: string) => void
  options: ChainOption[]
  exclude?: string
  title?: string
}

export function ChainSelectorModal({
  isOpen,
  onClose,
  value,
  onChange,
  options,
  exclude,
  title = 'Select Chain',
}: ChainSelectorModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen])

  const filtered = options.filter(
    (o) =>
      o.id !== exclude &&
      (o.label.toLowerCase().includes(query.toLowerCase()) ||
        CHAIN_LABELS[o.id]?.toLowerCase().includes(query.toLowerCase()) ||
        o.id.toLowerCase().includes(query.toLowerCase()))
  )

  const select = (id: string) => {
    onChange(id)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[70] left-1/2 top-[6vh] -translate-x-1/2 w-[min(440px,95vw)] rounded-3xl overflow-hidden"
            style={{
              background: 'var(--modal-bg, rgba(10,8,22,0.98))',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* Top shimmer */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#00D4AA]/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <span className="text-white font-display font-bold text-base tracking-wide">{title}</span>
              <button
                onClick={onClose}
                aria-label="Close chain selector"
                className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Search className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chain..."
                  className="flex-1 bg-transparent text-white text-sm font-ui outline-none placeholder:text-white/30"
                />
                {query && (
                  <button onClick={() => setQuery('')} aria-label="Clear search" className="text-white/30 hover:text-white/60 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Chain filter pills — wrapping grid so all are visible */}
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {options
                .filter((o) => o.id !== exclude)
                .map((o) => (
                  <button
                    key={o.id}
                    onClick={() => select(o.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer border"
                    style={
                      value === o.id
                        ? { background: 'rgba(108,92,231,0.25)', borderColor: 'rgba(108,92,231,0.5)' }
                        : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }
                    }
                  >
                    <ChainLogo chainId={o.id} size={16} />
                    <span className="text-[11px] font-display font-bold text-white/80">
                      {o.id.split('_')[0]}
                    </span>
                  </button>
                ))}
            </div>

            {/* Divider */}
            <div className="mx-4 h-[1px] bg-white/[0.06] mb-2" />

            {/* Chain list */}
            <div className="max-h-[360px] overflow-y-auto px-2 pb-4">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-white/30 text-sm font-ui">No chains found</div>
              ) : (
                filtered.map((chain) => {
                  const isSelected = value === chain.id
                  return (
                    <motion.button
                      key={chain.id}
                      onClick={() => select(chain.id)}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                      className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-2xl transition-all duration-150 cursor-pointer group"
                      style={isSelected ? { background: 'rgba(108,92,231,0.12)' } : {}}
                    >
                      <div className="relative shrink-0">
                        <ChainLogo chainId={chain.id} size={36} />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[14px] font-ui font-semibold text-white leading-tight">
                          {chain.label}
                        </div>
                        {chain.balanceLoading ? (
                          <div className="text-[11px] text-white/30 mt-0.5 animate-pulse">Loading…</div>
                        ) : chain.balance != null ? (
                          <div className="text-[11px] text-white/40 mt-0.5 font-number">{chain.balance} USDC</div>
                        ) : (
                          <div className="text-[11px] text-white/25 mt-0.5">—</div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#00D4AA] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
