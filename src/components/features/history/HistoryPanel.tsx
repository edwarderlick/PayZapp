import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import {
  Zap, ExternalLink, ArrowUp, ArrowDown, ArrowRightLeft, ArrowLeftRight,
  Repeat2, Vault, Filter, RefreshCw, Activity, TrendingUp,
} from 'lucide-react'
import { Spinner } from '../../ui/Spinner'
import { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import { useTransactions } from '../../../hooks/useTransactions'
import { TokenLogo } from '../../ui/TokenLogo'
import type { Transaction } from '../../../types'
import { EXPLORER_BY_CHAIN_ID, CIRCLE_CHAIN_IDS } from '../../../lib/chainUtils'

function timeAgo(ms: number) {
  const diff = Date.now() - ms
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function truncateAddress(addr: string) {
  if (!addr || addr === 'Circle Gateway Vault') return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function getExplorerUrl(tx: Transaction): string {
  if (tx.explorer_url) return tx.explorer_url
  if (!tx.tx_hash) return ''
  const chain = tx.from_chain ?? tx.to_chain
  if (chain) {
    const chainId = CIRCLE_CHAIN_IDS[chain]
    if (chainId && EXPLORER_BY_CHAIN_ID[chainId]) {
      return `${EXPLORER_BY_CHAIN_ID[chainId]}/${tx.tx_hash}`
    }
  }
  return `https://testnet.arcscan.app/tx/${tx.tx_hash}`
}

type FilterType = 'all' | 'send' | 'bridge' | 'swap' | 'vault'

const FILTER_TABS: { id: FilterType; label: string }[] = [
  { id: 'all',    label: 'All' },
  { id: 'send',   label: 'Send' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'swap',   label: 'Swap' },
  { id: 'vault',  label: 'Vault' },
]

const TX_COLORS: Record<string, string> = {
  send: '#f87171', receive: '#00D4AA', bridge: '#a78bfa',
  swap: '#facc15', vault_deposit: '#2dd4bf', vault_spend: '#fb923c', split: '#60a5fa',
}

function TxIcon({ type }: { type: Transaction['type'] }) {
  const color = TX_COLORS[type] ?? 'var(--text-muted)'
  const Icon = {
    send: ArrowUp, receive: ArrowDown, split: ArrowRightLeft,
    bridge: ArrowLeftRight, swap: Repeat2,
    vault_deposit: Vault, vault_spend: Vault,
  }[type] ?? Zap

  return (
    <div className="p-3 rounded-2xl border flex items-center justify-center group-hover:scale-105 transition-transform shrink-0"
      style={{ background: `${color}14`, borderColor: `${color}30` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
  )
}

function TxTokenBadge({ tx }: { tx: Transaction }) {
  if (tx.type === 'swap' && tx.token_in && tx.token_out) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <TokenLogo symbol={tx.token_in} size={14} />
        <span className="text-[10px] font-number text-white/40">→</span>
        <TokenLogo symbol={tx.token_out} size={14} />
      </div>
    )
  }
  return (
    <div className="mt-1">
      <TokenLogo symbol="USDC" size={14} />
    </div>
  )
}

function TxTitle({ tx }: { tx: Transaction }) {
  switch (tx.type) {
    case 'send':          return `Sent to ${truncateAddress(tx.to_address)}`
    case 'receive':       return `Received from ${truncateAddress(tx.from_address)}`
    case 'split':         return `Split: ${tx.room_name || 'Room'}`
    case 'bridge':        return tx.description || `Bridge`
    case 'swap':          return tx.description || `Swapped ${tx.token_in ?? ''} → ${tx.token_out ?? ''}`
    case 'vault_deposit': return 'Vault Deposit'
    case 'vault_spend':   return 'Vault Spend'
    default:              return tx.type
  }
}

function TxSubtitle({ tx }: { tx: Transaction }) {
  switch (tx.type) {
    case 'send':          return tx.description || 'USDC Transfer'
    case 'receive':       return tx.description || 'USDC Transfer'
    case 'split':         return `→ ${truncateAddress(tx.to_address)}`
    case 'bridge': {
      const from = tx.from_chain?.replace(/_/g, ' ') ?? ''
      const to   = tx.to_chain?.replace(/_/g, ' ') ?? ''
      return from && to ? `${from} → ${to}` : tx.description ?? ''
    }
    case 'swap':          return tx.description || ''
    case 'vault_deposit': return tx.description || `from ${tx.from_chain?.replace(/_/g, ' ') ?? ''}`
    case 'vault_spend':   return tx.description || `→ ${truncateAddress(tx.to_address)}`
    default:              return ''
  }
}

function amountColor(type: Transaction['type']) {
  return TX_COLORS[type] ?? 'var(--text-secondary)'
}

function amountSign(type: Transaction['type']) {
  return type === 'receive' ? '+' : '−'
}

function groupByDate(txs: Transaction[]): { label: string; items: Transaction[] }[] {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const result: { label: string; items: Transaction[] }[] = []
  const seen: Record<string, number> = {}

  for (const tx of txs) {
    const d = new Date(tx.timestamp)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    if (seen[label] === undefined) {
      seen[label] = result.length
      result.push({ label, items: [] })
    }
    result[seen[label]].items.push(tx)
  }

  return result
}

export function HistoryPanel() {
  const { address: connectedAddress } = useAccount()
  const { data, isLoading, refetch } = useTransactions(connectedAddress?.toLowerCase())
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = useMemo(() => data.filter((tx) => {
    if (filter === 'all')    return true
    if (filter === 'send')   return tx.type === 'send' || tx.type === 'receive' || tx.type === 'split'
    if (filter === 'bridge') return tx.type === 'bridge'
    if (filter === 'swap')   return tx.type === 'swap'
    if (filter === 'vault')  return tx.type === 'vault_deposit' || tx.type === 'vault_spend'
    return true
  }), [data, filter])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  const totalVolume = useMemo(
    () => data.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0),
    [data]
  )

  if (!connectedAddress) {
    return (
      <div className="w-full max-w-3xl mx-auto px-6 md:px-10 mt-12 text-center py-16">
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white mb-8">History</h1>
        <div className="p-16 text-center flex flex-col items-center rounded-[2rem]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="p-6 rounded-[2rem] mb-6" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)' }}>
            <Activity className="w-10 h-10" style={{ color: '#00D4AA' }} />
          </div>
          <h3 className="text-sm uppercase tracking-[0.2em] font-bold mb-2 text-white">Connect your wallet</h3>
          <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto">
            Connect MetaMask or a compatible wallet to view your complete transaction history.
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ y: 25, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-3xl mx-auto px-4 md:px-8 py-8 space-y-5"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-white mb-1">History</h1>
          <p className="text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: 'var(--text-muted)' }}>Transaction Ledger</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2.5 rounded-xl transition-colors cursor-pointer"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Transactions', value: data.length.toString(), icon: Activity },
            { label: 'Total Volume', value: `$${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp },
            { label: 'Networks', value: '7', icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-3.5 rounded-2xl text-center"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: '#00D4AA' }} />
              <div className="text-[13px] font-number font-bold text-white">{value}</div>
              <div className="text-[10px] font-ui mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex p-1.5 rounded-2xl gap-1"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
        {FILTER_TABS.map((tab) => {
          const count = tab.id === 'all' ? data.length : data.filter((tx) => {
            if (tab.id === 'send') return tx.type === 'send' || tx.type === 'receive' || tx.type === 'split'
            if (tab.id === 'bridge') return tx.type === 'bridge'
            if (tab.id === 'swap') return tx.type === 'swap'
            if (tab.id === 'vault') return tx.type === 'vault_deposit' || tx.type === 'vault_spend'
            return false
          }).length
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-ui font-semibold transition-all duration-200 cursor-pointer',
                filter === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
              )}
              style={filter === tab.id ? { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' } : {}}
            >
              {tab.label}
              {count > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-number"
                  style={{ background: filter === tab.id ? 'rgba(0,212,170,0.2)' : 'var(--bg-elevated)', color: filter === tab.id ? '#00D4AA' : 'var(--text-muted)' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Transaction list ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-5 rounded-2xl animate-pulse"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-12 h-12 rounded-2xl shrink-0" style={{ background: 'var(--bg-elevated)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full w-2/5" style={{ background: 'var(--bg-elevated)' }} />
                <div className="h-2.5 rounded-full w-1/3" style={{ background: 'var(--bg-elevated)' }} />
              </div>
              <div className="text-right space-y-2">
                <div className="h-3 rounded-full w-16 ml-auto" style={{ background: 'var(--bg-elevated)' }} />
                <div className="h-2.5 rounded-full w-10 ml-auto" style={{ background: 'var(--bg-elevated)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center rounded-[2rem]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="p-5 rounded-[2rem] mb-6" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)' }}>
            <Filter className="w-9 h-9" style={{ color: '#00D4AA' }} />
          </div>
          <h3 className="text-sm uppercase tracking-[0.2em] font-bold mb-3 text-white">
            {filter === 'all' ? 'No transactions yet' : `No ${filter} transactions`}
          </h3>
          <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
            {filter === 'all' ? 'Use Swap, Bridge, Vault, or Send to get started.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {groups.map((group, gi) => (
              <motion.div key={group.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: gi * 0.04 }}>
                {/* Date label */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="text-[10px] font-ui font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    {group.label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--bg-elevated)' }} />
                  <span className="text-[10px] font-number" style={{ color: 'var(--text-disabled)' }}>{group.items.length}</span>
                </div>

                {/* Transactions in this group */}
                <div className="rounded-[1.25rem] overflow-hidden"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  {group.items.map((tx, i) => {
                    const explorerUrl = getExplorerUrl(tx)
                    const color = amountColor(tx.type)
                    const subtitle = TxSubtitle({ tx })
                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        style={{ borderBottom: i < group.items.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <TxIcon type={tx.type} />
                          <div className="min-w-0">
                            <h4 className="text-[14px] font-display font-bold text-white leading-snug group-hover:text-[#00D4AA] transition-colors truncate max-w-[200px]">
                              <TxTitle tx={tx} />
                            </h4>
                            {subtitle && (
                              <p className="text-[11px] mt-0.5 truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
                                {subtitle}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              <TxTokenBadge tx={tx} />
                              <span className="text-[10px] font-number" style={{ color: 'var(--text-disabled)' }}>
                                {formatDate(tx.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="font-number text-[15px] font-black" style={{ color }}>
                              {amountSign(tx.type)}{parseFloat(tx.amount || '0').toFixed(2)}
                              <span className="text-[10px] uppercase tracking-wider font-display font-semibold ml-1 opacity-60">
                                {tx.token_in ?? 'USDC'}
                              </span>
                            </p>
                            <p className="mt-0.5 text-[10px] font-ui" style={{ color: 'var(--text-disabled)' }}>
                              {timeAgo(tx.timestamp)}
                            </p>
                          </div>
                          {explorerUrl && (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-2.5 rounded-xl transition-all -translate-x-2 group-hover:translate-x-0"
                              style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00D4AA' }}
                              title="View on explorer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
