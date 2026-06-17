import { motion } from 'framer-motion'
import { ArrowRight, Layers, Loader2, CheckCircle2, Circle, XCircle, RefreshCw } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { executeBridge } from '../../../lib/bridge'
import { saveTransaction } from '../../../hooks/useTransactions'
import { CIRCLE_CHAIN_IDS, readUsdcBalance, EXPLORER_BY_CHAIN_ID } from '../../../lib/chainUtils'

type Chain = { id: string; label: string; isSolana?: boolean }

const ALL_CHAINS: Chain[] = [
  { id: 'Arc_Testnet',      label: 'Arc Testnet' },
  { id: 'Ethereum_Sepolia', label: 'Ethereum Sepolia' },
  { id: 'Arbitrum_Sepolia', label: 'Arbitrum Sepolia' },
  { id: 'Base_Sepolia',     label: 'Base Sepolia' },
  { id: 'Optimism_Sepolia', label: 'Optimism Sepolia' },
  { id: 'Polygon_Amoy',     label: 'Polygon Amoy' },
  { id: 'Avalanche_Fuji',   label: 'Avalanche Fuji' },
  { id: 'Solana_Devnet',    label: 'Solana Devnet', isSolana: true },
]

const STEP_LABELS: Record<string, string> = {
  approve: 'Approve', burn: 'Burn', fetchAttestation: 'Attest', mint: 'Mint',
}
const STEP_COLORS: Record<string, string> = {
  approve: '#00D4AA', burn: '#f97316', fetchAttestation: '#60a5fa', mint: '#34d399',
}
const ORDERED_STEPS = ['approve', 'burn', 'fetchAttestation', 'mint']

type StepState = { key: string; label: string; status: 'idle' | 'active' | 'done' | 'error'; explorerUrl?: string }

export function BridgePanel() {
  const { address } = useAccount()
  const { connected: solanaConnected, publicKey: solanaPublicKey, disconnect: solanaDisconnect } = useSolanaWallet()
  const { setVisible: openSolanaModal } = useWalletModal()

  const [fromChain, setFromChain] = useState('Arc_Testnet')
  const [toChain, setToChain]     = useState('Arbitrum_Sepolia')
  const [amount, setAmount]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [steps, setSteps]         = useState<StepState[]>([])
  const [completed, setCompleted] = useState(false)
  const [balance, setBalance]     = useState<string | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const toChainOptions = ALL_CHAINS.filter((c) => c.id !== fromChain)

  const handleFromChainChange = (val: string) => {
    setFromChain(val)
    if (toChain === val) setToChain(ALL_CHAINS.find((c) => c.id !== val)?.id ?? 'Arbitrum_Sepolia')
    setBalance(null)
  }

  const isSolanaChain = (id: string) => id === 'Solana_Devnet'
  const fromIsSolana  = isSolanaChain(fromChain)
  const toIsSolana    = isSolanaChain(toChain)
  const needsSolana   = fromIsSolana || toIsSolana

  // Fetch source chain USDC balance
  const fetchBalance = useCallback(async () => {
    if (!address || fromIsSolana) return
    const chainId = CIRCLE_CHAIN_IDS[fromChain]
    if (!chainId) return
    setBalanceLoading(true)
    try {
      const bal = await readUsdcBalance(chainId, address)
      setBalance(bal)
    } catch { setBalance(null) }
    finally { setBalanceLoading(false) }
  }, [address, fromChain, fromIsSolana])

  useEffect(() => { fetchBalance() }, [fetchBalance])

  const updateStep = (type: string, status: StepState['status'], explorerUrl?: string) => {
    setSteps((prev) => {
      const existing = prev.find((s) => s.key === type)
      if (existing) return prev.map((s) => s.key === type ? { ...s, status, explorerUrl: explorerUrl ?? s.explorerUrl } : s)
      return [...prev, { key: type, label: STEP_LABELS[type] ?? type, status, explorerUrl }]
    })
  }

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    // Solana source needs Phantom connected
    if (fromIsSolana && !solanaConnected) {
      openSolanaModal(true)
      return
    }

    setLoading(true)
    setError(null)
    setCompleted(false)
    setSteps(ORDERED_STEPS.map((key) => ({ key, label: STEP_LABELS[key], status: 'idle' })))

    try {
      if (fromIsSolana) {
        throw new Error('Solana ? EVM bridge requires a Solana CCTP adapter. Coming soon — use an EVM chain as source for now.')
      }

      const result = await executeBridge({
        fromChain,
        toChain,
        amount,
        onEvent: (payload: any) => {
          const type = payload?.type as string
          if (!type) return
          if (payload.state === 'submitted' || payload.state === 'pending') {
            updateStep(type, 'active', payload.explorerUrl)
          } else if (payload.state === 'confirmed' || payload.state === 'success') {
            updateStep(type, 'done', payload.explorerUrl)
          } else if (payload.state === 'error') {
            updateStep(type, 'error')
          }
        },
      })

      setSteps(ORDERED_STEPS.map((key) => ({ key, label: STEP_LABELS[key], status: 'done' })))
      setCompleted(true)

      // Save to history
      if (address) {
        const burnStep = steps.find((s) => s.key === 'burn')
        const fromChainId = CIRCLE_CHAIN_IDS[fromChain]
        await saveTransaction({
          wallet:       address,
          type:         'bridge',
          from_address: address,
          to_address:   toIsSolana ? (solanaPublicKey?.toBase58() ?? '') : address,
          amount,
          description:  `${ALL_CHAINS.find((c) => c.id === fromChain)?.label} ? ${ALL_CHAINS.find((c) => c.id === toChain)?.label}`,
          tx_hash:      burnStep?.explorerUrl?.split('/').pop() ?? '',
          from_chain:   fromChain,
          to_chain:     toChain,
          explorer_url: burnStep?.explorerUrl ?? (fromChainId ? `${EXPLORER_BY_CHAIN_ID[fromChainId]}/` : ''),
        })
      }

      const toLabel = ALL_CHAINS.find((c) => c.id === toChain)?.label ?? toChain
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-[#09090B] border border-[#00D4AA]/30/20 p-5 rounded-3xl flex items-center justify-between gap-4 pointer-events-auto backdrop-blur-xl shadow-2xl relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4AA]/30 to-transparent" />
          <div className="flex items-center gap-4">
            <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30/20 p-3 rounded-2xl flex-shrink-0">
              <span className="text-[#00D4AA] text-base font-bold">?</span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-white tracking-wide">Bridge Complete!</p>
              <p className="text-xs text-white/50 font-mono mt-0.5">{amount} USDC ? {toLabel}</p>
            </div>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-white/40 hover:text-white transition-colors p-1">?</button>
        </div>
      ), { duration: 8000 })

      setAmount('')
      fetchBalance()
    } catch (err: any) {
      setError(err.message || 'Bridge failed. Please try again.')
      toast.error(err.message || 'Bridge failed')
    } finally {
      setLoading(false)
    }
  }

  const fromLabel = ALL_CHAINS.find((c) => c.id === fromChain)?.label ?? fromChain
  const toLabel   = ALL_CHAINS.find((c) => c.id === toChain)?.label ?? toChain

  return (
    <motion.div
      initial={{ y: 25, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-md mx-auto space-y-8"
    >
      <div className="mb-10 text-center">
        <div className="inline-flex p-5 rounded-[2rem] bg-white/[0.03] border border-white/10 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(108,92,231,0.1)] hover:border-[#00D4AA]/30/30 transition-all duration-500">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 mb-3">Bridge</h1>
        <p className="text-[12px] uppercase tracking-[0.25em] text-white/50 leading-relaxed font-medium">Move USDC across chains via Circle CCTP</p>
      </div>

      <Card className="p-7 bg-[#09090B] border border-white/[0.06] shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4AA]/30 to-transparent transition-opacity opacity-50 group-hover:opacity-100" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#00D4AA]/[0.015] rounded-full blur-3xl pointer-events-none" />

        {/* Chain Route */}
        <div className="flex items-center gap-3 justify-between mb-5">
          <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4">
            <label className="text-[10px] uppercase tracking-[0.15em] font-black text-white/40 mb-2 block">From</label>
            <select
              className="bg-transparent border-none text-[13px] font-bold text-white outline-none cursor-pointer w-full appearance-none"
              value={fromChain}
              onChange={(e) => handleFromChainChange(e.target.value)}
              disabled={loading}
            >
              {ALL_CHAINS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#09090B] text-white">{c.label}</option>
              ))}
            </select>
          </div>
          <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30/20 p-2 rounded-xl shrink-0">
            <ArrowRight className="w-4 h-4 text-[#00D4AA]" />
          </div>
          <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4">
            <label className="text-[10px] uppercase tracking-[0.15em] font-black text-white/40 mb-2 block">To</label>
            <select
              className="bg-transparent border-none text-[13px] font-bold text-white outline-none cursor-pointer w-full appearance-none"
              value={toChain}
              onChange={(e) => setToChain(e.target.value)}
              disabled={loading}
            >
              {toChainOptions.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#09090B] text-white">{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Solana wallet status */}
        {needsSolana && (
          <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-4 border ${solanaConnected ? 'bg-[#00D4AA]/5 border-[#00D4AA]/30/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-white/50">Solana Wallet</p>
              <p className="text-[12px] font-bold text-white mt-0.5">
                {solanaConnected && solanaPublicKey
                  ? `${solanaPublicKey.toBase58().slice(0, 6)}...${solanaPublicKey.toBase58().slice(-4)}`
                  : 'Not connected'}
              </p>
            </div>
            {solanaConnected ? (
              <button onClick={() => solanaDisconnect()} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider">Disconnect</button>
            ) : (
              <button onClick={() => openSolanaModal(true)} className="text-[10px] text-[#00D4AA] hover:text-white font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-[#00D4AA]/10 border border-[#00D4AA]/30/20">
                Connect Phantom
              </button>
            )}
          </div>
        )}

        {/* Amount */}
        <div className="bg-black/40 border border-white/5 p-6 rounded-3xl mb-4">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[11px] uppercase tracking-[0.15em] font-black text-white/40">Amount (USDC)</label>
            {!fromIsSolana && (
              <button
                className="text-[10px] text-white/40 hover:text-[#00D4AA] font-bold tracking-wider flex items-center gap-1 transition-colors"
                onClick={fetchBalance}
                disabled={balanceLoading}
              >
                {balanceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {balance !== null ? `${balance} USDC` : 'Check balance'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              className="border-none bg-transparent px-0 text-3xl font-mono focus:shadow-none !shadow-none flex-1 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-transparent"
            />
            {balance !== null && (
              <button
                onClick={() => setAmount(balance ?? '')}
                className="text-[10px] font-black uppercase tracking-widest text-[#00D4AA] bg-[#00D4AA]/10 border border-[#00D4AA]/30/20 px-3 py-1.5 rounded-xl hover:bg-[#00D4AA]/20 transition-colors shrink-0"
              >
                Max
              </button>
            )}
          </div>
        </div>

        {/* Step Progress */}
        {steps.length > 0 && (
          <div className="flex items-center justify-around gap-1 bg-black/50 border border-white/5 px-4 py-4 rounded-2xl mb-4">
            {ORDERED_STEPS.map((key, i) => {
              const step = steps.find((s) => s.key === key)
              const status = step?.status ?? 'idle'
              const color = STEP_COLORS[key]
              return (
                <div key={key} className="flex items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    {status === 'done' ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color }} />
                    ) : status === 'active' ? (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />
                    ) : status === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/20" />
                    )}
                    {step?.explorerUrl && status === 'done' ? (
                      <a href={step.explorerUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[9px] uppercase tracking-wider font-bold hover:underline"
                        style={{ color }}>
                        {STEP_LABELS[key]}
                      </a>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider font-bold"
                        style={{ color: status === 'idle' ? 'rgba(255,255,255,0.2)' : status === 'error' ? '#f87171' : color }}>
                        {STEP_LABELS[key]}
                      </span>
                    )}
                  </div>
                  {i < ORDERED_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-white/15 shrink-0 mb-3" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Info Row */}
        <div className="space-y-1.5 py-3 px-2 mb-4">
          <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] font-medium text-white/40">
            <span>Protocol</span>
            <span className="font-mono text-white/70">Circle CCTP V2</span>
          </div>
          <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] font-medium text-white/40 border-t border-white/5 pt-2">
            <span>Est. Time</span>
            <span className="font-mono text-white/70">~20 seconds</span>
          </div>
          <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] font-medium text-white/40 border-t border-white/5 pt-2">
            <span>Chains</span>
            <span className="font-mono text-white/70">8 supported</span>
          </div>
        </div>

        {/* Action Button */}
        {!address ? (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button onClick={openConnectModal} className="w-full h-14 bg-white text-black hover:bg-neutral-200 uppercase tracking-widest font-bold text-xs">
                Connect Wallet
              </Button>
            )}
          </ConnectButton.Custom>
        ) : needsSolana && !solanaConnected && fromIsSolana ? (
          <Button
            onClick={() => openSolanaModal(true)}
            className="w-full h-14 font-bold text-xs uppercase tracking-[0.2em] rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white"
            size="lg"
          >
            Connect Phantom to Bridge
          </Button>
        ) : (
          <Button
            onClick={handleBridge}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className={`w-full h-14 font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 rounded-2xl
              ${loading
                ? 'bg-[#00D4AA] text-white shadow-[0_0_20px_rgba(108,92,231,0.15)] cursor-wait'
                : 'bg-[#00D4AA] text-white hover:bg-[#7d70f0] shadow-[0_0_20px_rgba(108,92,231,0.1)] hover:shadow-[0_0_30px_rgba(108,92,231,0.25)] disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none disabled:cursor-not-allowed disabled:border disabled:border-white/5'
              }`}
            size="lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Bridging...</span>
              </div>
            ) : completed ? 'Bridge Again' : `Bridge ${fromLabel} ? ${toLabel}`}
          </Button>
        )}

        {error && (
          error.includes('not available in this preview') ? (
            <div className="p-5 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl mt-4 text-center space-y-3">
              <p className="text-indigo-300 text-sm font-semibold tracking-wide uppercase">? Bridge works in your local browser</p>
              <p className="text-white/60 text-xs leading-relaxed">Run the app locally: <span className="font-mono bg-black/50 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">npm run dev</span></p>
            </div>
          ) : (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mt-4 text-center">
              <p className="text-red-400 text-xs font-sans whitespace-pre-line leading-relaxed font-semibold">{error}</p>
            </div>
          )
        )}
      </Card>
    </motion.div>
  )
}
