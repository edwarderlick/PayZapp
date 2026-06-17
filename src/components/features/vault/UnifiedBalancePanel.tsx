import { motion } from 'framer-motion'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { ChainLogo } from '../../ui/ChainLogo'
import { ChainSelectorModal } from '../../ui/ChainSelectorModal'
import { Landmark, Zap, Globe, Blocks, Loader2, ArrowDownToLine, ArrowUpFromLine, RefreshCw, ChevronDown, Wallet } from 'lucide-react'

const VAULT_CHAIN_META: Record<string, { color: string; short: string }> = {
  Arc_Testnet:      { color: '#5B67F3', short: 'ARC'  },
  Ethereum_Sepolia: { color: '#8898f0', short: 'ETH'  },
  Arbitrum_Sepolia: { color: '#28A0F0', short: 'ARB'  },
  Base_Sepolia:     { color: '#6699ff', short: 'BASE' },
  Optimism_Sepolia: { color: '#ff6680', short: 'OP'   },
  Avalanche_Fuji:   { color: '#ff8585', short: 'AVAX' },
  Polygon_Amoy:     { color: '#b87af5', short: 'POL'  },
}
import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { depositToUnifiedBalance, spendFromUnifiedBalance } from '../../../lib/unifiedBalance'
import { saveTransaction } from '../../../hooks/useTransactions'
import { CIRCLE_CHAIN_IDS, readUsdcBalance, switchToChain, EXPLORER_BY_CHAIN_ID } from '../../../lib/chainUtils'

const DEPOSIT_CHAINS = [
  { id: 'Ethereum_Sepolia', label: 'Ethereum Sepolia' },
  { id: 'Arbitrum_Sepolia', label: 'Arbitrum Sepolia' },
  { id: 'Base_Sepolia',     label: 'Base Sepolia' },
  { id: 'Optimism_Sepolia', label: 'Optimism Sepolia' },
  { id: 'Polygon_Amoy',     label: 'Polygon Amoy' },
  { id: 'Avalanche_Fuji',   label: 'Avalanche Fuji' },
  { id: 'Arc_Testnet',      label: 'Arc Testnet' },
]

const SPEND_CHAINS = [
  { id: 'Arc_Testnet',      label: 'Arc Testnet' },
  { id: 'Ethereum_Sepolia', label: 'Ethereum Sepolia' },
  { id: 'Arbitrum_Sepolia', label: 'Arbitrum Sepolia' },
  { id: 'Base_Sepolia',     label: 'Base Sepolia' },
  { id: 'Optimism_Sepolia', label: 'Optimism Sepolia' },
]

type Mode = 'deposit' | 'spend'

function computeVaultBalance(walletAddress: string): string {
  try {
    const raw = localStorage.getItem('payzap_transactions')
    const all: any[] = raw ? JSON.parse(raw) : []
    const mine = all.filter(t => t.wallet?.toLowerCase() === walletAddress.toLowerCase())
    const deposited = mine.filter(t => t.type === 'vault_deposit').reduce((s, t) => s + parseFloat(t.amount || '0'), 0)
    const spent = mine.filter(t => t.type === 'vault_spend').reduce((s, t) => s + parseFloat(t.amount || '0'), 0)
    return Math.max(0, deposited - spent).toFixed(2)
  } catch { return '0.00' }
}

export function UnifiedBalancePanel() {
  const { address } = useAccount()
  const [mode, setMode]         = useState<Mode>('deposit')
  const [amount, setAmount]     = useState('')
  const [chain, setChain]       = useState('Ethereum_Sepolia')
  const [recipient, setRecipient] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [balance, setBalance]   = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [vaultBalance, setVaultBalance] = useState<string>('0.00')
  const [chainModalOpen, setChainModalOpen] = useState(false)

  const fetchBalance = useCallback(async () => {
    if (!address || mode !== 'deposit') return
    const chainId = CIRCLE_CHAIN_IDS[chain]
    if (!chainId) return
    setBalanceLoading(true)
    try {
      const bal = await readUsdcBalance(chainId, address)
      setBalance(bal)
    } catch { setBalance(null) }
    finally { setBalanceLoading(false) }
  }, [address, chain, mode])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  // Refresh vault balance whenever address changes or a tx is saved
  useEffect(() => {
    if (address) setVaultBalance(computeVaultBalance(address))
    const handler = () => { if (address) setVaultBalance(computeVaultBalance(address)) }
    window.addEventListener('payzap:tx-saved', handler)
    return () => window.removeEventListener('payzap:tx-saved', handler)
  }, [address])

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    const chainId = CIRCLE_CHAIN_IDS[chain]
    if (!chainId) return
    setLoading(true)
    setError(null)

    try {
      // Auto-switch wallet to the required chain before depositing
      toast.loading('Switching network...', { id: 'chain-switch' })
      await switchToChain(chainId)
      toast.dismiss('chain-switch')

      let lastExplorerUrl = ''
      const result = await depositToUnifiedBalance({
        fromChain: chain,
        amount,
        onEvent: (e: any) => {
          if (e.explorerUrl) lastExplorerUrl = e.explorerUrl
        },
      })
      if (!result) throw new Error('Deposit failed. Check console for details.')

      // Save to history
      if (address) {
        await saveTransaction({
          wallet:       address,
          type:         'vault_deposit',
          from_address: address,
          to_address:   'Circle Gateway Vault',
          amount,
          description:  `Deposited from ${DEPOSIT_CHAINS.find(c2 => c2.id === chain)?.label}`,
          tx_hash:      lastExplorerUrl.split('/').pop() ?? '',
          from_chain:   chain,
          explorer_url: lastExplorerUrl,
        })
      }

      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#13121b] border border-[rgba(198,191,255,0.15)] p-5 rounded-3xl flex items-center justify-between gap-4 pointer-events-auto shadow-2xl`}>
          <div className="flex items-center gap-4">
            <div className="bg-[#00D4AA]/10 border border-[rgba(198,191,255,0.15)] p-3 rounded-2xl"><span className="text-[#00D4AA] font-bold">?</span></div>
            <div>
              <p className="text-[14px] font-bold text-white">Deposit Complete!</p>
              <p className="text-xs text-white/50 font-mono mt-0.5">{amount} USDC deposited to Vault</p>
            </div>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-white/40 hover:text-white p-1">?</button>
        </div>
      ), { duration: 6000 })
      setAmount('')
      fetchBalance()
    } catch (err: any) {
      toast.dismiss('chain-switch')
      setError(err.message || 'Deposit failed')
      toast.error(err.message || 'Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSpend = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    const target = recipient.trim() || address
    if (!target) return
    setLoading(true)
    setError(null)

    try {
      let lastExplorerUrl = ''
      const result = await spendFromUnifiedBalance({
        toChain: chain,
        recipientAddress: target,
        amount,
        onEvent: (e: any) => {
          if (e.explorerUrl) lastExplorerUrl = e.explorerUrl
        },
      })
      if (!result) throw new Error('Spend failed. Check console for details.')

      // Save to history
      if (address) {
        const chainId = CIRCLE_CHAIN_IDS[chain]
        await saveTransaction({
          wallet:       address,
          type:         'vault_spend',
          from_address: 'Circle Gateway Vault',
          to_address:   target,
          amount,
          description:  `Spent on ${SPEND_CHAINS.find(c2 => c2.id === chain)?.label}`,
          tx_hash:      lastExplorerUrl.split('/').pop() ?? '',
          to_chain:     chain,
          explorer_url: lastExplorerUrl || (chainId ? `${EXPLORER_BY_CHAIN_ID[chainId]}/` : ''),
        })
      }

      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#13121b] border border-[rgba(198,191,255,0.15)] p-5 rounded-3xl flex items-center justify-between gap-4 pointer-events-auto shadow-2xl`}>
          <div className="flex items-center gap-4">
            <div className="bg-[#00D4AA]/10 border border-[rgba(198,191,255,0.15)] p-3 rounded-2xl"><span className="text-[#00D4AA] font-bold">?</span></div>
            <div>
              <p className="text-[14px] font-bold text-white">Spend Complete!</p>
              <p className="text-xs text-white/50 font-mono mt-0.5">{amount} USDC ? {SPEND_CHAINS.find(c2 => c2.id === chain)?.label}</p>
            </div>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-white/40 hover:text-white p-1">?</button>
        </div>
      ), { duration: 6000 })
      setAmount('')
      setRecipient('')
    } catch (err: any) {
      setError(err.message || 'Spend failed')
      toast.error(err.message || 'Spend failed')
    } finally {
      setLoading(false)
    }
  }

  const handleModeSwitch = (m: Mode) => {
    setMode(m)
    setChain(m === 'deposit' ? 'Ethereum_Sepolia' : 'Arc_Testnet')
    setError(null)
    setBalance(null)
  }

  return (
    <>
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto px-6 py-8 space-y-6"
    >
      <div className="mb-4 text-center">
        <motion.div
          className="inline-flex p-5 rounded-2xl mb-6 transition-all duration-300 cursor-pointer"
          style={{
            background: 'rgba(108,92,231,0.1)',
            border: '1px solid rgba(108,92,231,0.3)',
            boxShadow: '0 0 30px rgba(108,92,231,0.2)',
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(108,92,231,0.4)' }}
        >
          <Landmark className="w-8 h-8 text-[#00D4AA]" />
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight gradient-text mb-3">Vault</h1>
        <p className="text-xs uppercase tracking-[0.3em] text-[#00D4AA] font-display font-bold mt-1">Powered by Circle Gateway</p>
      </div>

      {/* Vault Balance Card */}
      {address && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'rgba(108,92,231,0.08)', border: '1px solid rgba(108,92,231,0.25)' }}
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4AA]/40 to-transparent" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-[rgba(255,255,255,0.4)] mb-1">Circle Gateway Vault Balance</div>
              <div className="text-4xl font-number font-black text-white leading-tight">
                {vaultBalance}
                <span className="text-lg text-[#00D4AA] ml-2 font-display">USDC</span>
              </div>
              <div className="text-[10px] text-[rgba(255,255,255,0.4)] mt-1">Available to spend across all chains</div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(70,234,229,0.1)', border: '1px solid rgba(70,234,229,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-[#00D4AA]">Live</span>
              </div>
              <div className="text-[9px] text-[rgba(255,255,255,0.4)] font-mono">Deposit ? Spend ?</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-2 bg-black/40 border border-white/5 p-1.5 rounded-2xl">
        <button
          onClick={() => handleModeSwitch('deposit')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all duration-300 ${mode === 'deposit' ? 'bg-[#00D4AA] text-white shadow-[0_0_20px_rgba(108,92,231,0.2)]' : 'text-white/40 hover:text-white/70'}`}
        >
          <ArrowDownToLine className="w-3.5 h-3.5" /> Deposit
        </button>
        <button
          onClick={() => handleModeSwitch('spend')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all duration-300 ${mode === 'spend' ? 'bg-[#00D4AA] text-white shadow-[0_0_20px_rgba(108,92,231,0.2)]' : 'text-white/40 hover:text-white/70'}`}
        >
          <ArrowUpFromLine className="w-3.5 h-3.5" /> Spend
        </button>
      </div>

      <Card className="p-7 bg-[#13121b] border border-[rgba(146,142,160,0.15)] shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4AA]/30 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

        {/* Chain Select — opens the same dark, logo-rich modal used by Bridge */}
        <button
          onClick={() => !loading && setChainModalOpen(true)}
          disabled={loading}
          className="w-full text-left p-4 rounded-2xl transition-all duration-300 hover:brightness-110 cursor-pointer disabled:cursor-not-allowed mb-4"
          style={{
            background: 'var(--bg-input)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${VAULT_CHAIN_META[chain]?.color ?? '#00D4AA'}40`,
            boxShadow: `0 4px 20px ${VAULT_CHAIN_META[chain]?.color ?? '#00D4AA'}15`,
          }}
        >
          <div className="text-[9px] uppercase tracking-[0.2em] font-black text-[rgba(255,255,255,0.4)] mb-2.5">
            {mode === 'deposit' ? 'From Chain' : 'To Chain'}
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: 'var(--bg-elevated)',
                border: `1px solid ${VAULT_CHAIN_META[chain]?.color ?? '#00D4AA'}40`,
              }}
            >
              <ChainLogo chainId={chain} size={32} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-black text-white leading-tight">
                {(mode === 'deposit' ? DEPOSIT_CHAINS : SPEND_CHAINS).find(c => c.id === chain)?.label ?? chain}
              </div>
              <div className="text-[10px] mt-0.5 font-mono" style={{ color: VAULT_CHAIN_META[chain]?.color ?? 'var(--text-muted)' }}>
                {VAULT_CHAIN_META[chain]?.short ?? ''} Network
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[rgba(255,255,255,0.4)] shrink-0" />
          </div>
        </button>

        {/* Amount with balance */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
          <div className="flex justify-between items-center mb-3">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-[rgba(255,255,255,0.4)]">You {mode === 'deposit' ? 'Send' : 'Withdraw'}</label>
            {mode === 'deposit' && (
              <button
                onClick={fetchBalance}
                disabled={balanceLoading || !address}
                className="text-[10px] text-[rgba(255,255,255,0.4)] hover:text-[#00D4AA] font-bold tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                {balanceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
                {balance !== null ? <><span className="font-mono">{balance}</span> USDC</> : 'Check balance'}
                {balance !== null && <span className="text-[#00D4AA] font-black ml-1">MAX</span>}
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              className="flex-1 bg-transparent text-[42px] font-mono font-black text-white outline-none placeholder:text-white/20 min-w-0 leading-none"
            />
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl shrink-0" style={{ background: 'rgba(39,117,202,0.15)', border: '1px solid rgba(39,117,202,0.35)' }}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2775ca] to-[#0154A0] flex items-center justify-center text-[11px] font-black text-white">$</div>
              <span className="text-sm font-black text-white">USDC</span>
            </div>
          </div>
          {balance !== null && parseFloat(amount) > parseFloat(balance) && mode === 'deposit' && (
            <p className="text-red-400 text-[10px] font-bold mt-2 font-mono">Insufficient: {balance} USDC available</p>
          )}
        </div>

        {/* Recipient (spend only) */}
        {mode === 'spend' && (
          <div className="bg-black/40 border border-white/5 p-5 rounded-3xl mb-4">
            <label className="text-[10px] uppercase tracking-[0.15em] font-black text-white/40 mb-2 block">Recipient Address (optional, defaults to you)</label>
            <Input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={loading}
              className="border-none bg-transparent px-0 text-sm font-mono focus:shadow-none !shadow-none w-full text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-transparent"
            />
          </div>
        )}

        {/* Network auto-switch notice */}
        {mode === 'deposit' && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-4">
            <span className="text-blue-400 text-[12px]">?</span>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Network will switch automatically to {DEPOSIT_CHAINS.find(c => c.id === chain)?.label} before deposit.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] font-medium text-white/40 px-2 py-3 mb-4 border-t border-white/5">
          <span>{mode === 'deposit' ? 'Deposits to' : 'Spends from'}</span>
          <span className="font-mono text-white/70">Circle Gateway Vault</span>
        </div>

        {/* Action */}
        {!address ? (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button onClick={openConnectModal} className="w-full h-14 bg-white text-black hover:bg-neutral-200 uppercase tracking-widest font-bold text-xs">
                Connect Wallet
              </Button>
            )}
          </ConnectButton.Custom>
        ) : (
          <Button
            onClick={mode === 'deposit' ? handleDeposit : handleSpend}
            disabled={loading || !amount || parseFloat(amount) <= 0 || (mode === 'deposit' && balance !== null && parseFloat(amount) > parseFloat(balance))}
            className={`w-full h-14 font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-2xl
              ${loading
                ? 'bg-[#00D4AA] text-white cursor-wait'
                : 'bg-[#00D4AA] text-white hover:bg-[#7d70f0] shadow-[0_0_20px_rgba(108,92,231,0.1)] hover:shadow-[0_0_30px_rgba(108,92,231,0.25)] disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none disabled:cursor-not-allowed disabled:border disabled:border-white/5'
              }`}
            size="lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{mode === 'deposit' ? 'Depositing...' : 'Spending...'}</span>
              </div>
            ) : mode === 'deposit' ? 'Deposit to Vault' : 'Spend from Vault'}
          </Button>
        )}

        {error && (
          error.includes('not available in this preview') ? (
            <div className="p-5 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl mt-4 text-center space-y-2">
              <p className="text-indigo-300 text-sm font-semibold uppercase">? Run locally to use Vault</p>
              <p className="text-white/60 text-xs"><span className="font-mono bg-black/50 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">npm run dev</span></p>
            </div>
          ) : (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mt-4 text-center">
              <p className="text-red-400 text-xs font-semibold">{error}</p>
            </div>
          )
        )}
      </Card>

      <div className="grid grid-cols-3 gap-0 border border-white/10 rounded-3xl overflow-hidden bg-black/40">
        <div className="p-6 border-r border-white/10 hover:bg-white/5 transition-colors group">
          <Globe className="w-5 h-5 text-white mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-2 text-white/90">Chain Agnostic</h3>
          <p className="text-[10px] text-white/40 leading-relaxed">Deposit from 7 chains, auto-switches network.</p>
        </div>
        <div className="p-6 border-r border-white/10 hover:bg-white/5 transition-colors group">
          <Zap className="w-5 h-5 text-white mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-2 text-white/90">Instant Spend</h3>
          <p className="text-[10px] text-white/40 leading-relaxed">No bridge wait times. Available immediately.</p>
        </div>
        <div className="p-6 hover:bg-white/5 transition-colors group">
          <Blocks className="w-5 h-5 text-white mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-2 text-white/90">One Balance</h3>
          <p className="text-[10px] text-white/40 leading-relaxed">All your USDC unified across chains.</p>
        </div>
      </div>
    </motion.div>

    {/* Rendered outside the animated (transform-bearing) wrapper above —
        Framer Motion applies a CSS transform to animated elements, and a
        transformed ancestor becomes the containing block for any
        position:fixed descendant, which broke this modal's full-viewport
        centering/sizing. Bridge's modals are siblings for the same reason. */}
    <ChainSelectorModal
      isOpen={chainModalOpen}
      onClose={() => setChainModalOpen(false)}
      value={chain}
      onChange={(id) => { setChain(id); setBalance(null) }}
      options={mode === 'deposit' ? DEPOSIT_CHAINS : SPEND_CHAINS}
      title={mode === 'deposit' ? 'From Chain' : 'To Chain'}
    />
    </>
  )
}
