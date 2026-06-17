import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useBalance, useDisconnect, useChainId } from 'wagmi'
import {
  X, Copy, ExternalLink, LogOut, Check,
  ArrowUp, ArrowDown, ArrowLeftRight, Repeat2, ArrowRightLeft, Zap,
  Vault as VaultIcon, Sun, Moon, RefreshCw, Plus, TrendingUp,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Link } from 'react-router-dom'
import { useUsdcBalance } from '../../hooks/useUsdcBalance'
import { useTransactions } from '../../hooks/useTransactions'
import { ChainLogo, CHAIN_LABELS } from '../ui/ChainLogo'
import { TokenLogo } from '../ui/TokenLogo'
import { WalletAvatar } from '../ui/WalletAvatar'
import { useTheme } from '../../contexts/ThemeContext'
import type { Transaction } from '../../types'

const CHAIN_ID_TO_KEY: Record<number, string> = {
  5042002:   'Arc_Testnet',
  11155111:  'Ethereum_Sepolia',
  421614:    'Arbitrum_Sepolia',
  84532:     'Base_Sepolia',
  11155420:  'Optimism_Sepolia',
  43113:     'Avalanche_Fuji',
  80002:     'Polygon_Amoy',
}

function TxTypeIcon({ type }: { type: Transaction['type'] }) {
  const cls = 'w-3.5 h-3.5'
  switch (type) {
    case 'send':          return <ArrowUp className={clsx(cls, 'text-red-400')} />
    case 'receive':       return <ArrowDown className={clsx(cls, 'text-[#00D4AA]')} />
    case 'bridge':        return <ArrowLeftRight className={clsx(cls, 'text-[#5B67F3]')} />
    case 'swap':          return <Repeat2 className={clsx(cls, 'text-yellow-400')} />
    case 'vault_deposit': return <VaultIcon className={clsx(cls, 'text-teal-400')} />
    case 'vault_spend':   return <VaultIcon className={clsx(cls, 'text-orange-400')} />
    case 'split':         return <ArrowRightLeft className={clsx(cls, 'text-[#28A0F0]')} />
    default:              return <Zap className={clsx(cls, 'text-white/40')} />
  }
}

const TX_TYPE_COLORS: Record<string, string> = {
  send: '#f87171', receive: '#00D4AA', bridge: '#8b5cf6',
  swap: '#facc15', vault_deposit: '#2dd4bf', vault_spend: '#fb923c', split: '#60a5fa',
}

const TX_TYPE_LABEL: Record<string, string> = {
  send: 'Sent', receive: 'Received', bridge: 'Bridge',
  swap: 'Swap', vault_deposit: 'Vault In', vault_spend: 'Vault Out', split: 'Split',
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function WalletPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { formatted: usdcBalance, refetch } = useUsdcBalance(address)
  const { data: ethBal } = useBalance({ address })
  const { data: txHistory } = useTransactions(address?.toLowerCase())
  const { theme, toggleTheme } = useTheme()

  const [tab, setTab] = useState<'assets' | 'transactions'>('assets')
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const isDark = theme === 'dark'
  const chainKey = chainId ? CHAIN_ID_TO_KEY[chainId] : null
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''
  const usdcNum = parseFloat(usdcBalance || '0')
  const ethNum = parseFloat(ethBal?.formatted ?? '0')
  const totalUsd = usdcNum + ethNum * 3400

  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setTimeout(() => setRefreshing(false), 800)
  }

  const recentTxs = txHistory.slice(0, 8)
  const txCount = txHistory.length

  const textPrimary   = isDark ? 'white'                   : '#0f0e1a'
  const textSecondary = isDark ? 'rgba(255,255,255,0.4)'   : 'rgba(0,0,0,0.4)'
  const divider       = isDark ? 'rgba(255,255,255,0.07)'  : 'rgba(0,0,0,0.06)'
  const hoverBg       = isDark ? 'rgba(255,255,255,0.04)'  : 'rgba(0,0,0,0.03)'
  const itemBorder    = isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.06)'
  const itemBg        = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.05)'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[68px] right-3 z-50 w-[340px] rounded-3xl overflow-hidden"
            style={{
              background: isDark ? 'rgba(10,8,20,0.98)' : 'rgba(250,250,255,0.98)',
              backdropFilter: 'blur(30px)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#00D4AA]/30 to-transparent" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3.5" style={{ borderBottom: `1px solid ${divider}` }}>
              <span className="font-display font-bold text-[15px] tracking-wide" style={{ color: textPrimary }}>
                My Wallet
              </span>
              <div className="flex items-center gap-1">
                <button onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className="p-2 rounded-xl transition-all cursor-pointer hover:bg-white/10" title="Toggle theme">
                  {isDark
                    ? <Sun className="w-4 h-4 text-white/50 hover:text-yellow-400 transition-colors" />
                    : <Moon className="w-4 h-4 text-black/40 hover:text-[#00D4AA] transition-colors" />
                  }
                </button>
                <button onClick={handleRefresh} aria-label="Refresh balances" className="p-2 rounded-xl transition-all cursor-pointer hover:bg-white/10" title="Refresh">
                  <RefreshCw className={`w-4 h-4 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                    style={{ color: refreshing ? '#00D4AA' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }} />
                </button>
                <button onClick={onClose} aria-label="Close wallet menu" className="p-2 rounded-xl transition-all cursor-pointer hover:bg-white/10">
                  <X className="w-4 h-4" style={{ color: textSecondary }} />
                </button>
              </div>
            </div>

            {/* ── Account row ── */}
            <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: `1px solid ${divider}` }}>
              <div className="relative shrink-0">
                {address && <WalletAvatar address={address} size={40} />}
                {chainKey && (
                  <div className="absolute -bottom-1 -right-1 rounded-full border-2" style={{ borderColor: isDark ? '#0a0814' : '#fafaff' }}>
                    <ChainLogo chainId={chainKey} size={14} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-number text-sm font-bold" style={{ color: textPrimary }}>{shortAddr}</span>
                  <span className="text-[9px] font-display font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,212,170,0.12)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.25)' }}>
                    EVM
                  </span>
                </div>
                {chainKey && (
                  <div className="text-[11px] mt-0.5" style={{ color: textSecondary }}>
                    {CHAIN_LABELS[chainKey] ?? 'Unknown'}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-0.5">
                <button onClick={copyAddress} aria-label="Copy wallet address" className="p-2 rounded-xl transition-all cursor-pointer hover:bg-white/10"
                  style={{ color: textSecondary }} title="Copy address">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a href={`https://testnet.arcscan.app/address/${address}`} target="_blank" rel="noopener noreferrer"
                  aria-label="View address on Arc explorer"
                  className="p-2 rounded-xl transition-all hover:bg-white/10" style={{ color: textSecondary }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => { disconnect(); onClose() }}
                  aria-label="Disconnect wallet"
                  className="p-2 rounded-xl transition-all cursor-pointer hover:text-red-400 hover:bg-red-500/10"
                  style={{ color: textSecondary }} title="Disconnect">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Portfolio value card ── */}
            <div className="px-4 pt-3 pb-1">
              <div className="p-4 rounded-2xl relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(91,103,243,0.10))', border: '1px solid rgba(0,212,170,0.2)' }}>
                <div className="absolute inset-0 opacity-30"
                  style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(91,103,243,0.3) 0%, transparent 60%)' }} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-ui font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Total Portfolio
                    </span>
                    <TrendingUp className="w-3.5 h-3.5" style={{ color: '#00D4AA' }} />
                  </div>
                  <div className="text-[26px] font-number font-black text-white mt-1 leading-none">
                    ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                      <TokenLogo symbol="USDC" size={14} />
                      <span className="text-[11px] font-number" style={{ color: 'rgba(255,255,255,0.6)' }}>{usdcNum.toFixed(2)} USDC</span>
                    </div>
                    {ethNum > 0 && (
                      <div className="flex items-center gap-1.5">
                        <TokenLogo symbol="ETH" size={14} />
                        <span className="text-[11px] font-number" style={{ color: 'rgba(255,255,255,0.6)' }}>{ethNum.toFixed(4)} {ethBal?.symbol}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="px-5 pt-3 flex gap-0" style={{ borderBottom: `1px solid ${divider}` }}>
              {(['assets', 'transactions'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={clsx('pb-3 px-1 mr-5 text-[13px] font-ui font-semibold transition-all cursor-pointer capitalize relative', tab === t ? '' : 'opacity-40 hover:opacity-70')}
                  style={{ color: textPrimary }}
                >
                  {t === 'assets' ? 'Assets' : `Activity${txCount > 0 ? ` (${txCount})` : ''}`}
                  {tab === t && (
                    <motion.div layoutId="wallet-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                      style={{ background: 'linear-gradient(135deg, #00D4AA, #00A882)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                </button>
              ))}
            </div>

            {/* ── Content ── */}
            <div className="pb-3">
              <AnimatePresence mode="wait">
                {tab === 'assets' ? (
                  <motion.div key="assets" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                    <div className="px-2 pt-2 space-y-0.5 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                      {/* USDC */}
                      <motion.div whileHover={{ backgroundColor: hoverBg }}
                        className="flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-colors cursor-default">
                        <div className="relative shrink-0">
                          <TokenLogo symbol="USDC" size={36} />
                          {chainKey && (
                            <div className="absolute -bottom-0.5 -right-0.5 rounded-full border" style={{ borderColor: isDark ? '#0a0814' : '#fafaff' }}>
                              <ChainLogo chainId={chainKey} size={14} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-ui font-semibold" style={{ color: textPrimary }}>USD Coin</div>
                          <div className="text-[11px] mt-0.5 font-ui" style={{ color: textSecondary }}>USDC · {chainKey ? CHAIN_LABELS[chainKey] : 'Arc Testnet'}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[13px] font-number font-bold" style={{ color: textPrimary }}>{usdcNum.toFixed(2)}</div>
                          <div className="text-[11px] mt-0.5 font-number" style={{ color: textSecondary }}>${usdcNum.toFixed(2)}</div>
                        </div>
                      </motion.div>

                      {/* ETH / native */}
                      {ethNum > 0 && (
                        <motion.div whileHover={{ backgroundColor: hoverBg }}
                          className="flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-colors cursor-default">
                          <div className="relative shrink-0">
                            <TokenLogo symbol="ETH" size={36} />
                            {chainKey && (
                              <div className="absolute -bottom-0.5 -right-0.5 rounded-full border" style={{ borderColor: isDark ? '#0a0814' : '#fafaff' }}>
                                <ChainLogo chainId={chainKey} size={14} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-ui font-semibold" style={{ color: textPrimary }}>{ethBal?.symbol ?? 'ETH'}</div>
                            <div className="text-[11px] mt-0.5 font-ui" style={{ color: textSecondary }}>Native · {chainKey ? CHAIN_LABELS[chainKey] : ''}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[13px] font-number font-bold" style={{ color: textPrimary }}>{ethNum.toFixed(5)}</div>
                            <div className="text-[11px] mt-0.5 font-number" style={{ color: textSecondary }}>${(ethNum * 3400).toFixed(2)}</div>
                          </div>
                        </motion.div>
                      )}

                      {usdcNum === 0 && ethNum === 0 && (
                        <div className="text-center py-8 text-sm font-ui" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>
                          No assets found
                        </div>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="px-4 pt-3 grid grid-cols-3 gap-2">
                      {[
                        { label: 'Send', href: '/send', color: '#00D4AA' },
                        { label: 'Swap', href: '/swap', color: '#5B67F3' },
                        { label: 'Bridge', href: '/bridge', color: '#F7931A' },
                      ].map(({ label, href, color }) => (
                        <Link key={href} to={href} onClick={onClose}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-ui font-semibold transition-all hover:scale-105 cursor-pointer"
                          style={{ background: `${color}14`, border: `1px solid ${color}30`, color }}>
                          {label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="transactions" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                    <div className="px-2 pt-2 space-y-0.5 max-h-[260px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                      {recentTxs.length === 0 ? (
                        <div className="text-center py-10">
                          <Zap className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: '#00D4AA' }} />
                          <p className="text-sm font-ui" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>No transactions yet</p>
                          <p className="text-xs font-ui mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)' }}>Start with Send or Swap</p>
                        </div>
                      ) : (
                        recentTxs.map((tx, i) => {
                          const color = TX_TYPE_COLORS[tx.type] ?? 'rgba(255,255,255,0.4)'
                          const isPositive = tx.type === 'receive'
                          return (
                            <motion.div key={tx.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              whileHover={{ backgroundColor: hoverBg }}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${color}14`, border: `1px solid ${color}25` }}>
                                <TxTypeIcon type={tx.type} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-ui font-semibold capitalize" style={{ color: textPrimary }}>
                                  {TX_TYPE_LABEL[tx.type] ?? tx.type}
                                </div>
                                <div className="text-[10px] mt-0.5 truncate" style={{ color: textSecondary }}>
                                  {timeAgo(tx.timestamp)}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-[12px] font-number font-bold" style={{ color: isPositive ? '#00D4AA' : textPrimary }}>
                                  {isPositive ? '+' : ''}{parseFloat(tx.amount || '0').toFixed(2)}
                                </div>
                                <div className="text-[10px] mt-0.5 font-number" style={{ color: textSecondary }}>
                                  {tx.token_in ?? 'USDC'}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })
                      )}
                    </div>

                    {recentTxs.length > 0 && (
                      <div className="px-4 pt-2">
                        <Link to="/history" onClick={onClose}
                          className="block w-full text-center text-[12px] font-ui font-semibold py-2.5 rounded-xl transition-all hover:opacity-80 cursor-pointer"
                          style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00D4AA' }}>
                          View all {txCount} transactions →
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Disconnect footer ── */}
            <div className="px-4 pb-4" style={{ borderTop: `1px solid ${divider}`, paddingTop: '12px' }}>
              <button
                onClick={() => { disconnect(); onClose() }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-ui font-semibold transition-all cursor-pointer hover:opacity-80"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Wallet
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
