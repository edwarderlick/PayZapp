import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Check } from 'lucide-react'
import { TokenLogo } from './TokenLogo'

export interface TokenOption {
  symbol: string
  name: string
  balance?: string
  balanceUsd?: string
  rateInUsdc?: number
}

interface TokenSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (symbol: string) => void
  options: TokenOption[]
  exclude?: string
  title?: string
}

export function TokenSelectorModal({
  isOpen,
  onClose,
  value,
  onChange,
  options,
  exclude,
  title = 'Select Token',
}: TokenSelectorModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [isOpen])

  const filtered = options.filter(
    (t) =>
      t.symbol !== exclude &&
      (t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase()))
  )

  const select = (symbol: string) => {
    onChange(symbol)
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
            className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(400px,95vw)] rounded-3xl overflow-hidden"
            style={{
              background: 'var(--modal-bg, rgba(10,8,22,0.98))',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
            }}
          >
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#5B67F3]/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <span className="text-white font-display font-bold text-base tracking-wide">{title}</span>
              <button
                onClick={onClose}
                aria-label="Close token selector"
                className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
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
                  placeholder="Search token..."
                  className="flex-1 bg-transparent text-white text-sm font-ui outline-none placeholder:text-white/30"
                />
                {query && (
                  <button onClick={() => setQuery('')} aria-label="Clear search" className="text-white/30 hover:text-white/60 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick pills */}
            <div className="px-4 pb-3 flex gap-2">
              {options.filter(t => t.symbol !== exclude).map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => select(t.symbol)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 transition-all border cursor-pointer"
                  style={
                    value === t.symbol
                      ? { background: 'rgba(162,155,254,0.2)', borderColor: 'rgba(162,155,254,0.4)' }
                      : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }
                  }
                >
                  <TokenLogo symbol={t.symbol} size={16} />
                  <span className="text-[11px] font-display font-bold text-white/80">{t.symbol}</span>
                </button>
              ))}
            </div>

            <div className="mx-4 h-[1px] bg-white/[0.06] mb-2" />

            {/* Token list */}
            <div className="max-h-[300px] overflow-y-auto px-2 pb-4">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-white/30 text-sm font-ui">No tokens found</div>
              ) : (
                filtered.map((token) => {
                  const isSelected = value === token.symbol
                  return (
                    <motion.button
                      key={token.symbol}
                      onClick={() => select(token.symbol)}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                      className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-2xl transition-all cursor-pointer"
                      style={isSelected ? { background: 'rgba(162,155,254,0.1)' } : {}}
                    >
                      <TokenLogo symbol={token.symbol} size={38} />

                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[14px] font-ui font-semibold text-white">{token.symbol}</div>
                        <div className="text-[11px] text-white/40 mt-0.5">{token.name}</div>
                      </div>

                      <div className="text-right shrink-0">
                        {token.balance && (
                          <div className="text-[13px] font-number font-bold text-white">{token.balance}</div>
                        )}
                        {token.balanceUsd && (
                          <div className="text-[11px] text-white/40 font-number">{token.balanceUsd}</div>
                        )}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#5B67F3] flex items-center justify-center ml-auto mt-1">
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
