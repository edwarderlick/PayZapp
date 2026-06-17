import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract } from 'wagmi'
import { isAddress, parseUnits, formatUnits, createPublicClient, http } from 'viem'
import { arbitrumSepolia, sepolia, baseSepolia, optimismSepolia, avalancheFuji, polygonAmoy } from 'viem/chains'
import {
  Send,
  ArrowDownUp,
  Layers,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Check,
  Sliders,
  Clock,
  RefreshCw,
  Wallet,
  Loader2,
  CheckCircle2,
  Circle,
  XCircle,
  ChevronDown,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'

import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { ChainSelectorModal } from '../../ui/ChainSelectorModal'
import { TokenSelectorModal } from '../../ui/TokenSelectorModal'
import { ChainLogo } from '../../ui/ChainLogo'
import { TokenLogo } from '../../ui/TokenLogo'
import { useSendUsdc } from '../../../hooks/useSendUsdc'
import { useUsdcBalance } from '../../../hooks/useUsdcBalance'
import { showTxToast } from '../../ui/TxToast'
import { executeSwap } from '../../../lib/swap'
import { executeBridge } from '../../../lib/bridge'
import { ERC20_ABI } from '../../../config/contracts'
import { saveTransaction } from '../../../hooks/useTransactions'
import { CIRCLE_CHAIN_IDS, EXPLORER_BY_CHAIN_ID } from '../../../lib/chainUtils'

type TabType = 'swap' | 'bridge' | 'send'

const TOKENS: Record<string, { address?: `0x${string}`; decimals: number; symbol: string; name: string; rateInUsdc: number }> = {
  USDC: {
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    rateInUsdc: 1.0,
  },
  EURC: {
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    decimals: 6,
    symbol: 'EURC',
    name: 'Euro Coin',
    rateInUsdc: 1.09,
  },
  cirBTC: {
    address: '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF',
    decimals: 8,
    symbol: 'cirBTC',
    name: 'Circle Bitcoin',
    rateInUsdc: 68430,
  },
}

// Sparklines raw heights for visual fidelity
const SPARKLINES: Record<string, number[]> = {
  USDC: [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
  EURC: [11, 10, 11, 13, 12, 14, 13, 15, 14, 15, 14.5, 15],
  cirBTC: [32, 34, 30, 28, 35, 41, 38, 44, 46, 42, 45, 48],
}

const CHAIN_META: Record<string, { color: string; short: string }> = {
  Arc_Testnet:      { color: '#5B67F3', short: 'ARC'  },
  Ethereum_Sepolia: { color: '#8898f0', short: 'ETH'  },
  Arbitrum_Sepolia: { color: '#28A0F0', short: 'ARB'  },
  Base_Sepolia:     { color: '#6699ff', short: 'BASE' },
  Optimism_Sepolia: { color: '#ff6680', short: 'OP'   },
  Avalanche_Fuji:   { color: '#ff8585', short: 'AVAX' },
  Polygon_Amoy:     { color: '#b87af5', short: 'POL'  },
}

function MiniSparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 60
    const y = 20 - ((val - min) / range) * 16
    return `${x},${y}`
  }).join(' ')

  return (
    <svg className="w-16 h-8 overflow-visible" viewBox="0 0 60 20">
      <polyline
        fill="none"
        stroke={positive ? '#00D4AA' : '#EF4444'}
        strokeWidth="1.8"
        points={points}
      />
    </svg>
  )
}

export function UnifiedHubPanel() {
  const { address } = useAccount()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Align page mode with router path
  const getTabFromPath = (path: string): TabType => {
    if (path.includes('swap')) return 'swap'
    if (path.includes('bridge')) return 'bridge'
    return 'send'
  }
  
  const activeTab = getTabFromPath(location.pathname)

  const handleTabChange = (tab: TabType) => {
    navigate(`/${tab}`)
  }

  // Use wagmi/contracts balance lookup
  const { formatted: usdcBalanceFormatted, raw: usdcRaw, refetch: refetchUsdc } = useUsdcBalance(address)

  // -----------------------------------------
  // Send Tab State & Logic
  // -----------------------------------------
  const [sendTo, setSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [gasPriority, setGasPriority] = useState<'standard' | 'fast' | 'instant'>('fast')
  const { send: sendTx, isPending: isSendPending, isConfirming: isSendConfirming, isSuccess: isSendSuccess, hash: sendHash, explorerUrl: sendExplorer, error: sendError } = useSendUsdc()
  
  // ENS Address resolution simulation
  const [isEnsResolving, setIsEnsResolving] = useState(false)
  const [resolvedEns, setResolvedEns] = useState<{ name: string; address: string } | null>(null)

  useEffect(() => {
    if (sendTo.endsWith('.eth')) {
      setIsEnsResolving(true)
      const timer = setTimeout(() => {
        setIsEnsResolving(false)
        const mockAddress = '0x71C24BF876B41C71C24BF876B41C71C24BF876B4'
        setResolvedEns({ name: sendTo, address: mockAddress })
        toast.success(`ENS Resolved: ${sendTo} → ${mockAddress.slice(0,6)}...${mockAddress.slice(-4)}`, {
          style: { background: '#09090B', color: '#fff', border: '1px solid rgba(226, 249, 121, 0.2)' }
        })
      }, 950)
      return () => clearTimeout(timer)
    } else {
      setResolvedEns(null)
    }
  }, [sendTo])

  const actualReceiverAddress = resolvedEns ? resolvedEns.address : sendTo
  const isSendToValid = isAddress(actualReceiverAddress)
  const isSendAmountValid = Number(sendAmount) > 0 && (!usdcRaw || parseUnits(sendAmount, 6) <= usdcRaw)
  const canSendSubmit = isSendToValid && isSendAmountValid && !isSendPending && !isSendConfirming

  // Sending is irreversible — a confirmation step sits between the button
  // click and the actual wallet transaction so a mistyped address or amount
  // can still be caught before anything is signed.
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false)

  const handleSend = () => {
    if (!canSendSubmit) return
    sendTx(actualReceiverAddress, sendAmount)
  }

  const handleSendClick = () => {
    if (!canSendSubmit) return
    setSendConfirmOpen(true)
  }

  const handleConfirmSend = () => {
    setSendConfirmOpen(false)
    handleSend()
  }

  useEffect(() => {
    if (isSendSuccess && sendHash && sendExplorer && address) {
      showTxToast(sendHash, sendExplorer)
      saveTransaction({
        wallet: address,
        type: 'send',
        from_address: address.toLowerCase(),
        to_address: actualReceiverAddress.toLowerCase(),
        amount: sendAmount,
        description: resolvedEns ? `Sent via ${resolvedEns.name}` : 'USDC Transfer',
        room_name: undefined,
        tx_hash: sendHash,
        explorer_url: sendExplorer,
        from_chain: 'Arc_Testnet',
      })
      refetchUsdc()
      setSendTo('')
      setSendAmount('')
    }
  }, [isSendSuccess, sendHash, sendExplorer, address])

  // -----------------------------------------
  // Swap/Bridge Tab State & Logic
  // -----------------------------------------
  const [tokenIn, setTokenIn] = useState('USDC')
  const [tokenOut, setTokenOut] = useState('EURC')
  const [swapAmount, setSwapAmount] = useState('')
  const [swapLoading, setSwapLoading] = useState(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  // Display-only — not passed to the SDK (see executeSwap call below).
  const [slippage, setSlippage] = useState('0.5')
  const [isSlippageOpen, setIsSlippageOpen] = useState(false)
  
  // Simulated balance loading for selected tokens
  const tokenInConfig = TOKENS[tokenIn]
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useReadContract({
    address: tokenInConfig?.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address && tokenInConfig?.address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenInConfig?.address,
      staleTime: 30_000,
      gcTime: 60_000,
      refetchOnWindowFocus: false,
    },
  })

  const formattedBalance = balanceData != null && tokenInConfig
    ? parseFloat(formatUnits(balanceData as bigint, tokenInConfig.decimals)).toFixed(4)
    : tokenInConfig?.address ? '0.0000' : '—'

  useEffect(() => {
    if (address) {
      refetchBalance()
    }
  }, [address, tokenIn, refetchBalance])

  const [kitKey, setKitKey] = useState<string | null>(null)
  
  useEffect(() => {
    const envKey = import.meta.env.VITE_CIRCLE_KIT_KEY
    if (envKey) {
      setKitKey(envKey)
    } else {
      const localKey = localStorage.getItem('payzap_kit_key')
      setKitKey(localKey || null)
    }
  }, [])

  const handleSetTokenIn = (val: string) => {
    if (val === tokenOut) {
      setTokenOut(tokenIn)
    }
    setTokenIn(val)
  }

  const handleSetTokenOut = (val: string) => {
    if (val === tokenIn) {
      setTokenIn(tokenOut)
    }
    setTokenOut(val)
  }

  const handleReverseSwap = () => {
    const prevIn = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(prevIn)
  }

  const handleMaxSwap = () => {
    setSwapAmount(formattedBalance)
  }

  const handleSwap = async () => {
    if (!kitKey) return
    if (!tokenInConfig?.address) {
      setSwapError(`${tokenIn} contract address is not configured for Arc Testnet. The token may not be tradeable yet on this network.`)
      return
    }
    if (tokenIn === tokenOut) {
      setSwapError('Cannot swap a token for itself.')
      return
    }
    setSwapLoading(true)
    setSwapError(null)
    try {
      await executeSwap({
        tokenIn,
        tokenOut,
        amountIn: swapAmount,
        kitKey,
      })
      toast.success(`Swap successful! ${swapAmount} ${tokenIn} → ${tokenOut}`, {
        style: { background: '#09090B', color: '#fff', border: '1px solid rgba(108,92,231,0.2)' }
      })
      if (address) {
        await saveTransaction({
          wallet:       address,
          type:         'swap',
          from_address: address,
          to_address:   address,
          amount:       swapAmount,
          description:  `${tokenIn} ? ${tokenOut}`,
          tx_hash:      '',
          token_in:     tokenIn,
          token_out:    tokenOut,
          from_chain:   'Arc_Testnet',
        })
      }
      setSwapAmount('')
      refetchUsdc()
      if (address) refetchBalance()
    } catch(err: any) {
      setSwapError(err.message || 'Swap failed. Please try again.')
    } finally {
      setSwapLoading(false)
    }
  }

  // Slippage status helper
  const slippageValue = parseFloat(slippage)
  const isSlippageHigh = slippageValue > 4.9
  const isSlippageUltraLow = slippageValue < 0.1

  // -----------------------------------------
  // Bridge State
  // -----------------------------------------
  const BRIDGE_CHAINS = [
    { id: 'Arc_Testnet',      label: 'Arc Testnet',       usdcAddress: '0x3600000000000000000000000000000000000000' as `0x${string}`, viemChain: null,            rpc: 'https://rpc.blockdaemon.testnet.arc.network' },
    { id: 'Ethereum_Sepolia', label: 'Ethereum Sepolia',  usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`, viemChain: sepolia,         rpc: null },
    { id: 'Arbitrum_Sepolia', label: 'Arbitrum Sepolia',  usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as `0x${string}`, viemChain: arbitrumSepolia, rpc: null },
    { id: 'Base_Sepolia',     label: 'Base Sepolia',      usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`, viemChain: baseSepolia,    rpc: null },
    { id: 'Optimism_Sepolia', label: 'Optimism Sepolia',  usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D9' as `0x${string}`, viemChain: optimismSepolia, rpc: null },
    { id: 'Avalanche_Fuji',   label: 'Avalanche Fuji',    usdcAddress: '0x5425890298aed601595a70AB815c96711a31Bc65' as `0x${string}`, viemChain: avalancheFuji,  rpc: 'https://api.avax-test.network/ext/bc/C/rpc' },
    { id: 'Polygon_Amoy',     label: 'Polygon Amoy',      usdcAddress: '0x41e94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' as `0x${string}`, viemChain: polygonAmoy,    rpc: 'https://rpc-amoy.polygon.technology' },
  ]

  const BRIDGE_STEP_COLORS: Record<string, string> = {
    approve: '#00D4AA',
    burn: '#f97316',
    fetchAttestation: '#60a5fa',
    mint: '#34d399',
  }
  const BRIDGE_STEP_LABELS: Record<string, string> = {
    approve: 'Approve',
    burn: 'Burn',
    fetchAttestation: 'Attest',
    mint: 'Mint',
  }
  const BRIDGE_ORDERED_STEPS = ['approve', 'burn', 'fetchAttestation', 'mint']

  type BridgeStepState = { key: string; status: 'idle' | 'active' | 'done' | 'error' }

  const [bridgeFromChain, setBridgeFromChain] = useState('Arbitrum_Sepolia')
  const [bridgeToChain, setBridgeToChain] = useState('Arc_Testnet')
  const [bridgeAmount, setBridgeAmount] = useState('')
  const [bridgeLoading, setBridgeLoading] = useState(false)
  const [bridgeError, setBridgeError] = useState<string | null>(null)
  const [bridgeSteps, setBridgeSteps] = useState<BridgeStepState[]>([])
  const [bridgeDone, setBridgeDone] = useState(false)
  const [bridgeSrcBalance, setBridgeSrcBalance] = useState<string | null>(null)
  const [bridgeBalanceLoading, setBridgeBalanceLoading] = useState(false)

  const fetchBridgeSrcBalance = useCallback(async (chainId: string, walletAddress: string) => {
    const chainCfg = BRIDGE_CHAINS.find((c) => c.id === chainId)
    if (!chainCfg || !walletAddress) return
    setBridgeBalanceLoading(true)
    try {
      const rpcUrl = chainCfg.rpc ?? (chainCfg.viemChain as any)?.rpcUrls?.default?.http?.[0]
      const client = chainCfg.viemChain
        ? createPublicClient({ chain: chainCfg.viemChain, transport: http() })
        : createPublicClient({ transport: http(rpcUrl) })
      const raw = await client.readContract({
        address: chainCfg.usdcAddress,
        abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      })
      setBridgeSrcBalance(parseFloat(formatUnits(raw, 6)).toFixed(4))
    } catch {
      setBridgeSrcBalance(null)
    } finally {
      setBridgeBalanceLoading(false)
    }
  }, [])

  const handleBridgeFromChange = (newFrom: string) => {
    setBridgeFromChain(newFrom)
    if (newFrom === bridgeToChain) {
      // Pick first chain that isn't the new from
      const fallback = BRIDGE_CHAINS.find((c) => c.id !== newFrom)?.id ?? 'Arc_Testnet'
      setBridgeToChain(fallback)
    }
  }

  const handleBridgeToChange = (newTo: string) => {
    setBridgeToChain(newTo)
    if (newTo === bridgeFromChain) {
      const fallback = BRIDGE_CHAINS.find((c) => c.id !== newTo)?.id ?? 'Arbitrum_Sepolia'
      setBridgeFromChain(fallback)
    }
  }

  const handleSwapBridgeChains = () => {
    const prevFrom = bridgeFromChain
    setBridgeFromChain(bridgeToChain)
    setBridgeToChain(prevFrom)
  }

  useEffect(() => {
    if (address) fetchBridgeSrcBalance(bridgeFromChain, address)
    else setBridgeSrcBalance(null)
  }, [bridgeFromChain, address])

  const updateBridgeStep = useCallback((type: string, status: BridgeStepState['status']) => {
    setBridgeSteps((prev) => {
      const updated = prev.some((s) => s.key === type)
        ? prev.map((s) => s.key === type ? { ...s, status } : s)
        : [...prev, { key: type, status }]

      // When a step finishes, automatically activate the next idle step
      if (status === 'done') {
        const idx = BRIDGE_ORDERED_STEPS.indexOf(type)
        if (idx >= 0 && idx < BRIDGE_ORDERED_STEPS.length - 1) {
          const nextKey = BRIDGE_ORDERED_STEPS[idx + 1]
          return updated.map((s) => s.key === nextKey && s.status === 'idle' ? { ...s, status: 'active' } : s)
        }
      }
      return updated
    })
  }, [])

  // Map Circle SDK step type names → our display keys
  const BRIDGE_TYPE_MAP: Record<string, string> = {
    approve: 'approve', transferToken: 'approve', allowance: 'approve',
    burn: 'burn', burnToken: 'burn',
    fetchAttestation: 'fetchAttestation', attestation: 'fetchAttestation', attest: 'fetchAttestation',
    mint: 'mint', mintToken: 'mint',
  }

  const handleBridge = async () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) return
    setBridgeLoading(true)
    setBridgeError(null)
    setBridgeDone(false)
    // Start with approve active immediately so the user sees live progress
    setBridgeSteps(BRIDGE_ORDERED_STEPS.map((k, i) => ({ key: k, status: i === 0 ? 'active' : 'idle' })))
    try {
      await executeBridge({
        fromChain: bridgeFromChain,
        toChain: bridgeToChain,
        amount: bridgeAmount,
        onEvent: (payload: any) => {
          // Circle BridgeKit fires the full result object on each state change.
          // It has a `steps` array with each step's current state.
          if (Array.isArray(payload?.steps)) {
            payload.steps.forEach((step: any) => {
              const rawType = (step?.type ?? step?.name ?? '') as string
              const mappedKey = BRIDGE_TYPE_MAP[rawType] ?? rawType
              if (!mappedKey) return
              const state = step?.state ?? ''
              if (state === 'submitted' || state === 'pending' || state === 'confirming' || state === 'signing') {
                updateBridgeStep(mappedKey, 'active')
              } else if (state === 'confirmed' || state === 'success' || state === 'complete') {
                updateBridgeStep(mappedKey, 'done')
              } else if (state === 'error' || state === 'failed') {
                updateBridgeStep(mappedKey, 'error')
              }
            })
            return
          }
          // Fallback: flat { type, state } event
          const rawType = (payload?.type ?? payload?.name ?? '') as string
          const mappedKey = BRIDGE_TYPE_MAP[rawType] ?? rawType
          if (!mappedKey) return
          const state = payload?.state ?? payload?.status ?? ''
          if (state === 'submitted' || state === 'pending' || state === 'confirming') {
            updateBridgeStep(mappedKey, 'active')
          } else if (state === 'confirmed' || state === 'success' || state === 'complete') {
            updateBridgeStep(mappedKey, 'done')
          } else if (state === 'error' || state === 'failed') {
            updateBridgeStep(mappedKey, 'error')
          }
        },
      })
      // executeBridge already throws with real error if state === 'error'
      setBridgeSteps(BRIDGE_ORDERED_STEPS.map((k) => ({ key: k, status: 'done' })))
      setBridgeDone(true)
      const toLabel = BRIDGE_CHAINS.find((c) => c.id === bridgeToChain)?.label ?? bridgeToChain
      toast.success(`Bridge complete! ${bridgeAmount} USDC → ${toLabel}`, {
        style: { background: '#09090B', color: '#fff', border: '1px solid rgba(108,92,231,0.2)' },
      })
      if (address) {
        const fromChainId = CIRCLE_CHAIN_IDS[bridgeFromChain]
        await saveTransaction({
          wallet:       address,
          type:         'bridge',
          from_address: address,
          to_address:   address,
          amount:       bridgeAmount,
          description:  `${BRIDGE_CHAINS.find(c => c.id === bridgeFromChain)?.label} ? ${toLabel}`,
          tx_hash:      '',
          from_chain:   bridgeFromChain,
          to_chain:     bridgeToChain,
          explorer_url: fromChainId ? `${EXPLORER_BY_CHAIN_ID[fromChainId]}/` : '',
        })
      }
      setBridgeAmount('')
      refetchUsdc()
    } catch (err: any) {
      setBridgeError(err.message || 'Bridge failed. Please try again.')
    } finally {
      setBridgeLoading(false)
    }
  }

  // Modal open state
  const [tokenInModalOpen, setTokenInModalOpen] = useState(false)
  const [tokenOutModalOpen, setTokenOutModalOpen] = useState(false)
  const [bridgeFromModalOpen, setBridgeFromModalOpen] = useState(false)
  const [bridgeToModalOpen, setBridgeToModalOpen] = useState(false)

  const TOKEN_OPTIONS = Object.values(TOKENS).map((t) => ({
    symbol: t.symbol,
    name: t.name,
    rateInUsdc: t.rateInUsdc,
  }))

  const CHAIN_OPTIONS = BRIDGE_CHAINS.map((c) => ({
    id: c.id,
    label: c.label,
  }))

  const TAB_CONFIG = {
    swap:   { Icon: ArrowDownUp, label: 'Swap',   color: '#00D4AA', glow: 'rgba(0,212,170,0.25)' },
    bridge: { Icon: Layers,      label: 'Bridge',  color: '#00D4AA', glow: 'rgba(0,212,170,0.2)' },
    send:   { Icon: Send,        label: 'Send',    color: '#00D4AA', glow: 'rgba(0,212,170,0.2)' },
  }

  return (
    <>
    <div
      className="w-full flex flex-col items-center justify-center px-4 py-8"
      style={{ minHeight: 'calc(100vh - 116px)' }}
    >

      {/* CENTRAL HUB */}
      <div className="w-full max-w-[520px] space-y-4">

        {/* -- Tab Switcher -- */}
        <div
          className="flex p-1 rounded-2xl w-full gap-1"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
          }}
        >
          {(['swap', 'bridge', 'send'] as const).map((tab) => {
            const isActive = activeTab === tab
            const cfg = TAB_CONFIG[tab]
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className="relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-ui font-semibold text-sm capitalize cursor-pointer transition-all duration-200 select-none"
                style={{
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <cfg.Icon
                  className="w-4 h-4 relative z-10"
                  style={{ color: isActive ? '#00D4AA' : 'rgba(255,255,255,0.35)' }}
                />
                <span className="relative z-10">{cfg.label}</span>
              </button>
            )
          })}
        </div>

        {/* SWAP MODULE */}
        <AnimatePresence mode="wait">
          {activeTab === 'swap' && (
            <motion.div
              key="swap"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="relative rounded-2xl overflow-visible"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                }}
              >
                <div className="p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-ui font-bold text-white tracking-tight">
                      Swap
                    </h2>
                    <p className="text-xs mt-0.5 font-ui" style={{ color: 'var(--text-muted)' }}>Circle V4 Router</p>
                  </div>

                  {/* SLIPPAGE CONTROLLERS */}
                  <div className="relative">
                    <button
                      onClick={() => setIsSlippageOpen(!isSlippageOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-ui text-sm cursor-pointer"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Sliders className="w-3.5 h-3.5" style={{ color: '#00D4AA' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{slippage}%</span>
                    </button>
                    {isSlippageOpen && (
                      <div className="absolute right-0 mt-2 p-4 rounded-2xl w-56 shadow-2xl z-20 space-y-3"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                        <div className="flex justify-between items-center text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                          <span>Slippage</span>
                          <span>Auto</span>
                        </div>
                        <div className="flex gap-1.5">
                          {['0.1', '0.5', '1.0'].map((val) => (
                            <button
                              key={val}
                              onClick={() => setSlippage(val)}
                              className="flex-1 py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all"
                              style={slippage === val
                                ? { background: 'rgba(0,212,170,0.15)', borderColor: 'rgba(0,212,170,0.4)', color: '#00D4AA' }
                                : { background: 'var(--bg-elevated)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }
                              }
                            >
                              {val}%
                            </button>
                          ))}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={slippage}
                            onChange={(e) => setSlippage(e.target.value)}
                            placeholder="Custom"
                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/90 font-mono focus:border-[#00D4AA]/30/40 outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 font-mono text-[10px]">%</span>
                        </div>
                        {isSlippageHigh && (
                          <p className="text-[10px] text-amber-500 font-bold leading-relaxed font-sans flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                            Frontrunning risks. Slippage too high.
                          </p>
                        )}
                        {isSlippageUltraLow && (
                          <p className="text-[10px] text-amber-400 font-bold leading-relaxed font-sans flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                            Transaction might fail on volatility.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* You Pay Section */}
                <div
                  className="rounded-xl p-4 relative"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex justify-between items-center mb-3 select-none">
                    <span className="text-xs font-ui font-medium" style={{ color: 'var(--text-muted)' }}>You Pay</span>
                    <button
                      onClick={handleMaxSwap}
                      disabled={formattedBalance === '—'}
                      className="flex items-center gap-1.5 text-xs transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Wallet className="w-3 h-3" />
                      <span className="font-number">{isBalanceLoading ? '…' : formattedBalance}</span>
                      {formattedBalance !== '—' && (
                        <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer hover:opacity-80 transition-opacity" style={{ background: 'rgba(0,212,170,0.12)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.25)' }}>MAX</span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      className="flex-1 bg-transparent text-[40px] font-number font-semibold text-white outline-none placeholder:text-white/15 min-w-0 leading-none"
                    />
                    <button
                      onClick={() => setTokenInModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                    >
                      <TokenLogo symbol={tokenIn} size={24} />
                      <span className="text-sm font-semibold text-white">{tokenIn}</span>
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>
                  {swapAmount && parseFloat(swapAmount) > 0 && (
                    <div className="mt-2 text-xs font-number" style={{ color: 'var(--text-muted)' }}>
                      ≈ ${(parseFloat(swapAmount) * tokenInConfig.rateInUsdc).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>

                {/* Reverse Button */}
                {/* Reverse Button */}
                <div className="relative h-4 flex items-center justify-center my-1">
                  <motion.button
                    onClick={handleReverseSwap}
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute z-10 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
                  >
                    <ArrowDownUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  </motion.button>
                </div>

                {/* You Receive Section */}
                <div className="rounded-xl p-4 relative mt-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <label className="text-xs font-ui font-medium mb-3 block select-none" style={{ color: 'var(--text-muted)' }}>You Receive</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-[40px] font-number font-semibold leading-none min-w-0" style={{ color: '#00D4AA' }}>
                      {swapAmount && parseFloat(swapAmount) > 0
                        ? (parseFloat(swapAmount) * (tokenInConfig.rateInUsdc / TOKENS[tokenOut].rateInUsdc)).toFixed(4)
                        : <span style={{ color: 'var(--text-disabled)' }}>0.00</span>
                      }
                    </div>
                    <button
                      onClick={() => setTokenOutModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                    >
                      <TokenLogo symbol={tokenOut} size={24} />
                      <span className="text-sm font-semibold text-white">{tokenOut}</span>
                      <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>
                  {swapAmount && parseFloat(swapAmount) > 0 && (
                    <div className="mt-2 text-xs font-number" style={{ color: 'var(--text-muted)' }}>
                      ≈ ${(parseFloat(swapAmount) * (tokenInConfig.rateInUsdc / TOKENS[tokenOut].rateInUsdc) * TOKENS[tokenOut].rateInUsdc).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>

                {/* Route & rate info */}
                {tokenIn !== tokenOut && (
                  <div className="mt-4 rounded-xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    {/* Exchange rate */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-[11px] font-ui" style={{ color: 'var(--text-muted)' }}>Rate</span>
                      <span className="text-[11px] font-number font-medium" style={{ color: 'var(--text-secondary)' }}>
                        1 {tokenIn} ≈ {(tokenInConfig.rateInUsdc / TOKENS[tokenOut].rateInUsdc).toFixed(4)} {tokenOut}
                      </span>
                    </div>
                    {/* Min received */}
                    {swapAmount && parseFloat(swapAmount) > 0 && (
                      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-[11px] font-ui" style={{ color: 'var(--text-muted)' }}>Min. Received</span>
                        <span className="text-[11px] font-number font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {(parseFloat(swapAmount) * (tokenInConfig.rateInUsdc / TOKENS[tokenOut].rateInUsdc) * (1 - parseFloat(slippage || '0.5') / 100)).toFixed(4)} {tokenOut}
                        </span>
                      </div>
                    )}
                    {/* Route */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-[11px] font-ui" style={{ color: 'var(--text-muted)' }}>Route</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-number" style={{ color: 'var(--text-secondary)' }}>{tokenIn}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full" style={{ background: '#00D4AA' }} />
                          <div className="h-px w-6" style={{ background: 'var(--bg-elevated)' }} />
                          <div className="w-1 h-1 rounded-full" style={{ background: '#5B67F3' }} />
                        </div>
                        <span className="text-[11px] font-number" style={{ color: 'var(--text-secondary)' }}>{tokenOut}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: 'rgba(0,212,170,0.10)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>Circle V4</span>
                      </div>
                    </div>
                    {/* Fee */}
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[11px] font-ui" style={{ color: 'var(--text-muted)' }}>Network Fee</span>
                      <span className="text-[11px] font-number" style={{ color: '#00D4AA' }}>~$0.01</span>
                    </div>
                  </div>
                )}

                {/* Token address warning */}
                {!tokenInConfig?.address && (
                  <div className="mt-5 p-3.5 rounded-2xl flex items-start gap-3 text-xs" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-black uppercase tracking-wide text-amber-300">{tokenIn} not available</p>
                      <p className="text-white/45 font-sans leading-relaxed">The {tokenIn} contract address is not configured for Arc Testnet. To fix: open MetaMask → click the {tokenIn} token → copy its contract address and add it to the TOKENS config in the code.</p>
                    </div>
                  </div>
                )}

                {/* cirBTC → USDC direct pool warning — this specific direction has been
                    observed to revert on Arc Testnet's swap pool while every other
                    direction (including USDC → cirBTC) succeeds. Route through EURC instead. */}
                {tokenIn === 'cirBTC' && tokenOut === 'USDC' && (
                  <div className="mt-5 p-3.5 rounded-2xl flex items-start gap-3 text-xs" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-black uppercase tracking-wide text-amber-300">Direct route may be thin right now</p>
                      <p className="text-white/45 font-sans leading-relaxed">cirBTC → USDC has reverted in testing while cirBTC → EURC works fine. If this fails, swap <span className="text-white/70 font-semibold">cirBTC → EURC</span>, then <span className="text-white/70 font-semibold">EURC → USDC</span> instead.</p>
                    </div>
                  </div>
                )}

                {/* Swap CTA */}
                <div className="mt-5">
                  {!address ? (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <motion.button
                          onClick={openConnectModal}
                          whileHover={{ scale: 1.01, boxShadow: '0 0 40px rgba(0,212,170,0.4)' }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full h-[52px] rounded-xl font-ui font-semibold text-sm text-white cursor-pointer"
                          style={{ background: 'linear-gradient(135deg, #00D4AA, #00A882)', boxShadow: '0 4px 24px rgba(0,212,170,0.3)' }}
                        >
                          Connect Wallet
                        </motion.button>
                      )}
                    </ConnectButton.Custom>
                  ) : !kitKey ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl flex gap-3 text-sm"
                        style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)' }}>
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-ui font-semibold text-amber-300 text-xs mb-1">Kit Key Required</p>
                          <p className="text-xs font-ui leading-relaxed" style={{ color: 'var(--text-muted)' }}>Add <code className="font-number px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>VITE_CIRCLE_KIT_KEY</code> to your env.</p>
                        </div>
                      </div>
                      <button className="w-full h-[52px] rounded-xl font-ui font-semibold text-sm cursor-not-allowed"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-disabled)', border: '1px solid var(--border-subtle)' }} disabled>
                        Configuration Needed
                      </button>
                    </div>
                  ) : (
                    <motion.button
                      onClick={handleSwap}
                      disabled={swapLoading || !swapAmount || parseFloat(swapAmount) <= 0}
                      whileHover={!swapLoading && !!swapAmount && parseFloat(swapAmount) > 0 ? { scale: 1.01, boxShadow: '0 0 40px rgba(0,212,170,0.4)' } : {}}
                      whileTap={!swapLoading && !!swapAmount && parseFloat(swapAmount) > 0 ? { scale: 0.99 } : {}}
                      className="w-full h-[52px] rounded-xl font-ui font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200"
                      style={{
                        background: swapLoading
                          ? 'rgba(0,212,170,0.3)'
                          : !swapAmount || parseFloat(swapAmount) <= 0
                            ? 'rgba(255,255,255,0.04)'
                            : 'linear-gradient(135deg, #00D4AA, #00A882)',
                        boxShadow: !swapLoading && !!swapAmount && parseFloat(swapAmount) > 0
                          ? '0 4px 24px rgba(0,212,170,0.3)'
                          : 'none',
                        color: !swapAmount || parseFloat(swapAmount) <= 0 ? 'rgba(255,255,255,0.2)' : '#0D0E14',
                        cursor: swapLoading ? 'wait' : !swapAmount || parseFloat(swapAmount) <= 0 ? 'not-allowed' : 'pointer',
                        border: !swapAmount || parseFloat(swapAmount) <= 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      }}
                    >
                      {swapLoading ? (
                        <><Spinner size="sm" /><span>Swapping…</span></>
                      ) : (
                        <><ArrowDownUp className="w-4 h-4" /><span>Swap {tokenIn} → {tokenOut}</span></>
                      )}
                    </motion.button>
                  )}
                </div>

                {swapError && (
                  <div className="p-3.5 rounded-xl mt-4 text-left" style={{ background: 'rgba(240,82,82,0.08)', border: '1px solid rgba(240,82,82,0.2)' }}>
                    <p className="text-red-400 text-xs font-ui leading-relaxed">{swapError}</p>
                  </div>
                )}
                </div>{/* end inner p-6 */}
              </div>{/* end card */}
            </motion.div>
          )}

          {/* BRIDGE MODULE */}
          {activeTab === 'bridge' && (
            <motion.div
              key="bridge"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 relative"
            >
              {/* Bridge card */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
              <div className="p-6 space-y-5">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-ui font-bold text-white">Bridge</h2>
                  <p className="text-xs mt-0.5 font-ui" style={{ color: 'var(--text-muted)' }}>Circle CCTP v2</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00D4AA' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#00D4AA' }} />
                  </span>
                  <span className="text-[11px] font-ui font-semibold" style={{ color: '#00D4AA' }}>Live</span>
                </div>
              </div>

              {/* Chain Selector Pair */}
              <div className="grid grid-cols-[1fr_56px_1fr] items-center gap-3">
                {/* From Chain */}
                <button
                  onClick={() => !bridgeLoading && setBridgeFromModalOpen(true)}
                  className={`cursor-pointer w-full text-left rounded-xl transition-all hover:border-white/15 ${bridgeLoading ? 'pointer-events-none opacity-60' : ''}`}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '14px' }}
                >
                    <div className="text-[10px] font-ui font-medium mb-2.5" style={{ color: 'var(--text-muted)' }}>From</div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                      >
                        <ChainLogo chainId={bridgeFromChain} size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-ui font-semibold text-white leading-tight truncate">
                          {BRIDGE_CHAINS.find(c => c.id === bridgeFromChain)?.label ?? bridgeFromChain}
                        </div>
                        <div className="text-[10px] mt-0.5 truncate font-number" style={{ color: 'var(--text-muted)' }}>
                          {bridgeBalanceLoading ? 'Loading...' : bridgeSrcBalance !== null ? `${bridgeSrcBalance} USDC` : address ? '—' : 'Connect'}
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-[rgba(255,255,255,0.4)] shrink-0" />
                    </div>
                </button>

                {/* Flip Button */}
                <motion.button
                  onClick={handleSwapBridgeChains}
                  disabled={bridgeLoading}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-[52px] h-[52px] rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    background: 'rgba(0,212,170,0.10)',
                    border: '1px solid rgba(0,212,170,0.25)',
                    boxShadow: '0 0 20px rgba(0,212,170,0.12)',
                  }}
                >
                  <ArrowDownUp className="w-5 h-5 text-[#00D4AA]" />
                </motion.button>

                {/* To Chain */}
                {/* To Chain */}
                <button
                  onClick={() => !bridgeLoading && setBridgeToModalOpen(true)}
                  className={`cursor-pointer w-full text-left rounded-xl transition-all hover:border-white/15 ${bridgeLoading ? 'pointer-events-none opacity-60' : ''}`}
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '14px' }}
                >
                    <div className="text-[10px] font-ui font-medium mb-2.5" style={{ color: 'var(--text-muted)' }}>To</div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                      >
                        <ChainLogo chainId={bridgeToChain} size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-ui font-semibold text-white leading-tight truncate">
                          {BRIDGE_CHAINS.find(c => c.id === bridgeToChain)?.label ?? bridgeToChain}
                        </div>
                        <div className="text-[10px] mt-0.5 font-ui" style={{ color: 'var(--text-muted)' }}>Destination</div>
                      </div>
                      <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </div>
                </button>
              </div>

              {/* Amount Input */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-ui font-medium" style={{ color: 'var(--text-muted)' }}>Amount</span>
                  <button
                    onClick={() => bridgeSrcBalance && setBridgeAmount(bridgeSrcBalance)}
                    disabled={bridgeLoading || !bridgeSrcBalance}
                    className="flex items-center gap-1.5 text-xs font-ui transition-colors disabled:opacity-40"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Wallet className="w-3 h-3" />
                    <span className="font-number">{bridgeBalanceLoading ? '...' : bridgeSrcBalance !== null ? bridgeSrcBalance : '—'} USDC</span>
                    {bridgeSrcBalance && <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer" style={{ background: 'rgba(0,212,170,0.12)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.25)' }}>MAX</span>}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={bridgeAmount}
                    onChange={(e) => setBridgeAmount(e.target.value)}
                    disabled={bridgeLoading}
                    className="flex-1 bg-transparent text-[40px] font-number font-semibold text-white outline-none placeholder:text-white/15 min-w-0 leading-none"
                  />
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl shrink-0"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                  >
                    <TokenLogo symbol="USDC" size={22} />
                    <span className="text-sm font-semibold text-white">USDC</span>
                  </div>
                </div>
                {bridgeAmount && parseFloat(bridgeAmount) > 0 && (
                  <div className="text-xs font-number" style={{ color: 'var(--text-muted)' }}>
                    ≈ ${parseFloat(bridgeAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </div>

              {/* You Receive */}
              <AnimatePresence>
                {bridgeAmount && parseFloat(bridgeAmount) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.18)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                      >
                        <ChainLogo chainId={bridgeToChain} size={24} />
                      </div>
                      <div>
                        <div className="text-[10px] font-ui font-medium" style={{ color: 'var(--text-muted)' }}>You Receive</div>
                        <div className="text-xs font-ui font-medium text-white mt-0.5">{BRIDGE_CHAINS.find(c => c.id === bridgeToChain)?.label}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-number font-semibold" style={{ color: '#00D4AA' }}>{parseFloat(bridgeAmount).toFixed(2)}</span>
                      <span className="text-sm font-ui font-medium" style={{ color: 'var(--text-muted)' }}>USDC</span>
                      <div className="px-2 py-0.5 rounded-full ml-1" style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)' }}>
                        <span className="text-[9px] font-ui font-semibold" style={{ color: '#00D4AA' }}>1:1</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CCTP Route */}
              <div className="flex items-center gap-3 px-1">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <ChainLogo chainId={bridgeFromChain} size={22} />
                  </div>
                  <span className="text-[9px] font-ui font-medium" style={{ color: 'var(--text-muted)' }}>{CHAIN_META[bridgeFromChain]?.short ?? 'SRC'}</span>
                </div>

                <div className="flex-1 flex items-center gap-1.5">
                  <div className="h-[1px] flex-1 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
                  <motion.div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00D4AA' }}
                    animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                  />
                  <div className="px-2.5 py-1 rounded-lg shrink-0" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}>
                    <span className="text-[9px] font-ui font-semibold" style={{ color: '#00D4AA' }}>Circle CCTP</span>
                  </div>
                  <motion.div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#5B67F3' }}
                    animate={{ scale: [1, 1.8, 1], opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.6, delay: 0.8 }}
                  />
                  <div className="h-[1px] flex-1 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
                </div>

                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <ChainLogo chainId={bridgeToChain} size={22} />
                  </div>
                  <span className="text-[9px] font-ui font-medium" style={{ color: 'var(--text-muted)' }}>{CHAIN_META[bridgeToChain]?.short ?? 'DST'}</span>
                </div>
              </div>

              {/* Step Progress */}
              {bridgeSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-4 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-ui font-medium" style={{ color: 'var(--text-muted)' }}>Bridge Progress</span>
                    <span className="text-xs font-number" style={{ color: 'var(--text-secondary)' }}>
                      {bridgeSteps.filter(s => s.status === 'done').length}/{BRIDGE_ORDERED_STEPS.length}
                    </span>
                  </div>
                  <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: 'linear-gradient(90deg, #00D4AA, #5B67F3)' }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${(bridgeSteps.filter(s => s.status === 'done').length / BRIDGE_ORDERED_STEPS.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between">
                    {BRIDGE_ORDERED_STEPS.map((key) => {
                      const step = bridgeSteps.find((s) => s.key === key)
                      const status = step?.status ?? 'idle'
                      return (
                        <div key={key} className="flex flex-col items-center gap-1.5">
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300`}
                            style={
                              status === 'done'   ? { borderColor: 'rgba(0,212,170,0.4)', background: 'rgba(0,212,170,0.12)' } :
                              status === 'active' ? { borderColor: 'rgba(0,212,170,0.6)', background: 'rgba(0,212,170,0.15)' } :
                              status === 'error'  ? { borderColor: 'rgba(240,82,82,0.4)', background: 'rgba(240,82,82,0.10)' } :
                                                    { borderColor: 'rgba(255,255,255,0.08)', background: 'var(--bg-elevated)' }
                            }>
                            {status === 'done'   ? <CheckCircle2 className="w-4 h-4" style={{ color: '#00D4AA' }} /> :
                             status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#00D4AA' }} /> :
                             status === 'error'  ? <XCircle className="w-4 h-4 text-red-400" /> :
                                                   <Circle className="w-4 h-4" style={{ color: 'var(--text-disabled)' }} />}
                          </div>
                          <span className="text-[9px] font-ui font-medium" style={{
                            color: status === 'idle'  ? 'rgba(255,255,255,0.25)' :
                                   status === 'error' ? '#f87171' :
                                   status === 'done'  ? '#00D4AA' : '#00D4AA'
                          }}>
                            {BRIDGE_STEP_LABELS[key]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Info row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Protocol', value: 'CCTP v2', Icon: ShieldCheck },
                  { label: 'Est. Time', value: '~20s', Icon: Clock },
                  { label: 'Bridge Fee', value: 'Free', Icon: Zap },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: '#00D4AA' }} />
                    <div>
                      <div className="text-[10px] font-ui" style={{ color: 'var(--text-muted)' }}>{label}</div>
                      <div className="text-xs font-ui font-semibold text-white mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bridge CTA */}
              {!address ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <motion.button
                      onClick={openConnectModal}
                      whileHover={{ scale: 1.01, boxShadow: '0 0 40px rgba(0,212,170,0.4)' }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full h-[52px] rounded-xl font-ui font-semibold text-sm cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #00D4AA, #00A882)', color: '#0D0E14', boxShadow: '0 4px 24px rgba(0,212,170,0.3)' }}
                    >
                      Connect Wallet
                    </motion.button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <motion.button
                  onClick={handleBridge}
                  disabled={bridgeLoading || !bridgeAmount || parseFloat(bridgeAmount || '0') <= 0}
                  whileHover={!bridgeLoading && !!bridgeAmount && parseFloat(bridgeAmount) > 0 ? { scale: 1.01, boxShadow: '0 0 40px rgba(0,212,170,0.4)' } : {}}
                  whileTap={!bridgeLoading && !!bridgeAmount && parseFloat(bridgeAmount) > 0 ? { scale: 0.99 } : {}}
                  className="w-full h-[52px] rounded-xl font-ui font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200"
                  style={{
                    background: bridgeDone
                      ? 'linear-gradient(135deg, #00D4AA, #00A882)'
                      : bridgeLoading
                        ? 'rgba(0,212,170,0.25)'
                        : !bridgeAmount || parseFloat(bridgeAmount) <= 0
                          ? 'rgba(255,255,255,0.04)'
                          : 'linear-gradient(135deg, #00D4AA, #00A882)',
                    boxShadow: !bridgeLoading && !!bridgeAmount && parseFloat(bridgeAmount) > 0
                      ? '0 4px 24px rgba(0,212,170,0.3)' : 'none',
                    color: !bridgeAmount || parseFloat(bridgeAmount) <= 0 ? 'rgba(255,255,255,0.2)' : '#0D0E14',
                    cursor: bridgeLoading ? 'wait' : !bridgeAmount || parseFloat(bridgeAmount) <= 0 ? 'not-allowed' : 'pointer',
                    border: !bridgeAmount || parseFloat(bridgeAmount) <= 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  {bridgeLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Bridging…</span></>
                  ) : bridgeDone ? (
                    <><CheckCircle2 className="w-4 h-4" /><span>Bridge Complete!</span></>
                  ) : (
                    <><Layers className="w-4 h-4" /><span>Bridge {CHAIN_META[bridgeFromChain]?.short ?? 'SRC'} ? {CHAIN_META[bridgeToChain]?.short ?? 'DST'}</span></>
                  )}
                </motion.button>
              )}

              {bridgeError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl"
                  style={{ background: 'rgba(240,82,82,0.08)', border: '1px solid rgba(240,82,82,0.2)' }}
                >
                  <p className="text-red-400 text-xs font-ui">{bridgeError}</p>
                </motion.div>
              )}

              </div>{/* end bridge p-6 */}
              </div>{/* end bridge card */}
            </motion.div>
          )}

          {/* SEND TO ADDRESS MODULE */}
          {activeTab === 'send' && (
            <motion.div
              key="send"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="rounded-2xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
              >
              <div className="p-6 space-y-5">

                <div>
                  <h2 className="text-xl font-ui font-bold text-white">Send</h2>
                  <p className="text-xs mt-0.5 font-ui" style={{ color: 'var(--text-muted)' }}>USDC → Arc Testnet</p>
                </div>

                {/* Recipient */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-ui font-medium" style={{ color: 'var(--text-muted)' }}>Recipient</label>
                    {isEnsResolving && (
                      <span className="flex items-center gap-1.5 text-[10px] font-ui font-medium animate-pulse" style={{ color: '#00D4AA' }}>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Resolving ENS...
                      </span>
                    )}
                    {resolvedEns && (
                      <span className="flex items-center gap-1.5 text-[10px] font-ui font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,212,170,0.10)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
                        <Check className="w-3 h-3" />
                        ENS Resolved
                      </span>
                    )}
                  </div>
                  
                  <div className="relative group">
                    <Input
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                      placeholder="0x... or name.eth"
                      className="font-mono pr-12 focus:border-[#00D4AA]/30/70 group-hover:border-white/20 transition-all duration-300"
                    />
                    {sendTo && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isSendToValid ? (
                          <span className="text-[#00D4AA] text-xl drop-shadow-[0_0_12px_rgba(108,92,231,0.6)] font-extrabold">?</span>
                        ) : (
                          <span className="text-red-400 text-xl drop-shadow-[0_0_12px_rgba(248,113,113,0.6)] font-extrabold">?</span>
                        )}
                      </div>
                    )}
                  </div>

                  {resolvedEns && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-3 rounded-xl flex items-center justify-between text-xs font-number"
                      style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}
                    >
                      <span className="font-ui text-[10px]" style={{ color: 'var(--text-muted)' }}>Resolved:</span>
                      <span style={{ color: '#00D4AA' }}>{resolvedEns.address.slice(0, 10)}...{resolvedEns.address.slice(-8)}</span>
                    </motion.div>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-ui font-medium" style={{ color: 'var(--text-muted)' }}>Amount</label>
                    <button
                      onClick={() => setSendAmount(usdcBalanceFormatted)}
                      className="flex items-center gap-1.5 text-xs font-ui cursor-pointer transition-opacity hover:opacity-80"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Wallet className="w-3 h-3" />
                      <span className="font-number">{usdcBalanceFormatted} USDC</span>
                      <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(0,212,170,0.12)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.25)' }}>MAX</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-[40px] font-number font-semibold text-white outline-none placeholder:text-white/15 leading-none py-4 px-4 rounded-xl"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '6px 10px' }}>
                      <TokenLogo symbol="USDC" size={20} />
                      <span className="text-sm font-semibold text-white">USDC</span>
                    </div>
                  </div>
                </div>

                {/* Gas Priority */}
                <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-ui font-medium" style={{ color: 'var(--text-muted)' }}>Gas Priority</label>
                    <span className="text-xs font-number" style={{ color: 'var(--text-muted)' }}>Base: 4 Gwei</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: 'standard', speed: '~12s', price: '$0.02', label: 'Standard' },
                      { id: 'fast', speed: '~4s', price: '$0.06', label: 'Fast' },
                      { id: 'instant', speed: '<1.5s', price: '$0.15', label: 'Instant' },
                    ] as const).map((priority) => {
                      const isGasActive = gasPriority === priority.id
                      return (
                        <button
                          key={priority.id}
                          onClick={() => setGasPriority(priority.id)}
                          className="py-3 px-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer"
                          style={isGasActive
                            ? { background: 'rgba(0,212,170,0.10)', borderColor: 'rgba(0,212,170,0.35)', color: '#00D4AA' }
                            : { background: 'var(--bg-elevated)', borderColor: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)' }
                          }
                        >
                          <span className="text-xs font-ui font-semibold">{priority.label}</span>
                          <span className="text-[10px] font-number" style={{ color: isGasActive ? 'rgba(0,212,170,0.7)' : 'rgba(255,255,255,0.35)' }}>{priority.speed}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {sendError && (
                  <div className="p-3.5 rounded-xl" style={{ background: 'rgba(240,82,82,0.08)', border: '1px solid rgba(240,82,82,0.2)' }}>
                    <p className="text-red-400 text-xs font-ui">{sendError.message.split('\n')[0]}</p>
                  </div>
                )}

                {/* Send CTA */}
                <motion.button
                  onClick={handleSendClick}
                  disabled={!canSendSubmit}
                  whileHover={canSendSubmit ? { scale: 1.01, boxShadow: '0 0 40px rgba(0,212,170,0.4)' } : {}}
                  whileTap={canSendSubmit ? { scale: 0.99 } : {}}
                  className="w-full h-[52px] rounded-xl font-ui font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: isSendSuccess
                      ? 'linear-gradient(135deg, #00D4AA, #00A882)'
                      : 'linear-gradient(135deg, #00D4AA, #00A882)',
                    boxShadow: canSendSubmit ? '0 4px 24px rgba(0,212,170,0.3)' : 'none',
                    color: '#0D0E14',
                  }}
                >
                  {isSendPending ? (
                    <><Spinner size="sm" /><span>Sign in wallet…</span></>
                  ) : isSendConfirming ? (
                    <><Spinner size="sm" /><span>Submitting…</span></>
                  ) : isSendSuccess ? (
                    <><Check className="w-5 h-5" /><span>Sent Successfully</span></>
                  ) : (
                    <><Send className="w-4 h-4" strokeWidth={2.5} /><span>Send USDC</span></>
                  )}
                </motion.button>
              </div>{/* end send p-6 */}
              </div>{/* end send card */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>

      {/* Token selector modals (Swap) */}
      <TokenSelectorModal
        isOpen={tokenInModalOpen}
        onClose={() => setTokenInModalOpen(false)}
        value={tokenIn}
        onChange={handleSetTokenIn}
        options={TOKEN_OPTIONS}
        exclude={tokenOut}
        title="You Pay"
      />
      <TokenSelectorModal
        isOpen={tokenOutModalOpen}
        onClose={() => setTokenOutModalOpen(false)}
        value={tokenOut}
        onChange={handleSetTokenOut}
        options={TOKEN_OPTIONS}
        exclude={tokenIn}
        title="You Receive"
      />

      {/* Chain selector modals (Bridge) */}
      <ChainSelectorModal
        isOpen={bridgeFromModalOpen}
        onClose={() => setBridgeFromModalOpen(false)}
        value={bridgeFromChain}
        onChange={handleBridgeFromChange}
        options={CHAIN_OPTIONS}
        exclude={bridgeToChain}
        title="From Chain"
      />
      <ChainSelectorModal
        isOpen={bridgeToModalOpen}
        onClose={() => setBridgeToModalOpen(false)}
        value={bridgeToChain}
        onChange={handleBridgeToChange}
        options={CHAIN_OPTIONS}
        exclude={bridgeFromChain}
        title="To Chain"
      />

      {/* Send confirmation — rendered as a sibling of the animated tab content
          above (not nested inside it). Framer Motion applies a CSS transform
          to animated elements, and a transformed ancestor becomes the
          containing block for position:fixed descendants, which would
          otherwise squeeze/clip this modal to the small animated card
          instead of the full viewport. */}
      <AnimatePresence>
        {sendConfirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[80]"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
              onClick={() => setSendConfirmOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-[81] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,92vw)] rounded-3xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}
            >
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00D4AA]/50 to-transparent" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.25)' }}>
                    <Send className="w-4.5 h-4.5" style={{ color: '#00D4AA' }} />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold" style={{ color: 'var(--text-primary)' }}>Confirm Send</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This action can't be undone</p>
                  </div>
                </div>

                <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Recipient</div>
                  {resolvedEns ? (
                    <>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{resolvedEns.name}</div>
                      <div className="text-xs font-number mt-0.5" style={{ color: 'var(--text-muted)' }}>{actualReceiverAddress.slice(0, 10)}…{actualReceiverAddress.slice(-8)}</div>
                    </>
                  ) : (
                    <div className="text-sm font-number break-all" style={{ color: 'var(--text-primary)' }}>{actualReceiverAddress}</div>
                  )}
                </div>

                <div className="rounded-2xl p-4 mb-3 flex items-center justify-between" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Amount</div>
                    <div className="text-2xl font-number font-bold" style={{ color: 'var(--text-primary)' }}>{sendAmount}</div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <TokenLogo symbol="USDC" size={20} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>USDC</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1 py-2 mb-4">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Network</span>
                  <div className="flex items-center gap-1.5">
                    <ChainLogo chainId="Arc_Testnet" size={14} />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Arc Testnet</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSendConfirmOpen(false)}
                    className="flex-1 h-12 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSend}
                    className="flex-1 h-12 rounded-xl text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #00D4AA, #00A882)', color: '#0D0E14' }}
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Send
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
