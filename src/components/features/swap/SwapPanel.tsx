import { motion } from 'framer-motion'
import { ArrowDownUp, AlertTriangle, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Card } from '../../ui/Card'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { executeSwap } from '../../../lib/swap'
import { ERC20_ABI } from '../../../config/contracts'

const TOKENS: { [key: string]: { address?: `0x${string}`; decimals: number; symbol: string } } = {
  USDC: {
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
    symbol: 'USDC',
  },
  EURC: {
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    decimals: 6,
    symbol: 'EURC',
  },
  cirBTC: {
    decimals: 8,
    symbol: 'cirBTC',
  },
}

function TokenIcon({ symbol }: { symbol: string }) {
  if (symbol === 'USDC') {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2775CA] to-[#0154A0] flex items-center justify-center shadow-[0_0_15px_rgba(39,117,202,0.4)] text-[13px] font-extrabold text-white shrink-0 font-sans tracking-wide">
        $
      </div>
    )
  }
  if (symbol === 'EURC') {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1E967A] to-[#116450] flex items-center justify-center shadow-[0_0_15px_rgba(30,150,122,0.4)] text-[13px] font-extrabold text-white shrink-0 font-sans tracking-wide">
        �
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F7931A] to-[#C96F00] flex items-center justify-center shadow-[0_0_15px_rgba(247,147,26,0.4)] text-[13px] font-extrabold text-white shrink-0 font-sans tracking-wide">
      ?
    </div>
  )
}

export function SwapPanel() {
  const { address } = useAccount()
  const [tokenIn, setTokenIn] = useState('USDC')
  const [tokenOut, setTokenOut] = useState('cirBTC')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [kitKey, setKitKey] = useState<string | null>(null)
  const [typedKey, setTypedKey] = useState('')
  const [showKeySetup, setShowKeySetup] = useState(false)

  // Load key logic
  const loadKey = () => {
    const envKey = import.meta.env.VITE_CIRCLE_KIT_KEY
    if (envKey) {
      setKitKey(envKey)
      return
    }
    const localKey = localStorage.getItem('payzap_kit_key')
    if (localKey) {
      setKitKey(localKey)
      return
    }
    setKitKey(null)
  }

  useEffect(() => {
    loadKey()
  }, [])

  const handleSaveKey = () => {
    if (!typedKey.trim()) return
    localStorage.setItem('payzap_kit_key', typedKey.trim())
    loadKey()
    toast.success('Kit Key saved successfully.')
    setShowKeySetup(false)
    setTypedKey('')
  }

  // Token balance reading
  const tokenConfig = TOKENS[tokenIn]
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useReadContract({
    address: tokenConfig?.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address && tokenConfig?.address ? [address] : undefined,
    query: { enabled: !!address && !!tokenConfig?.address },
  })

  const formattedBalance = balanceData != null && tokenConfig
    ? parseFloat(formatUnits(balanceData as bigint, tokenConfig.decimals)).toFixed(4)
    : '0.00'

  useEffect(() => {
    if (address) {
      refetchBalance()
    }
  }, [address, tokenIn, refetchBalance])

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

  const handleReverse = () => {
    const prevIn = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(prevIn)
  }

  const handleSwap = async () => {
    if (!kitKey) return
    setLoading(true)
    setError(null)
    try {
      await executeSwap({
        tokenIn,
        tokenOut,
        amountIn: amount,
        kitKey,
      })

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-sm w-full bg-[#09090B] border border-[#00D4AA]/30/20 p-5 rounded-3xl flex items-center justify-between gap-4 pointer-events-auto backdrop-blur-xl shadow-2xl relative overflow-hidden`}
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4AA]/30 to-transparent" />
          <div className="flex items-center gap-4">
            <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30/20 p-3 rounded-2xl flex-shrink-0">
              <span className="text-[#00D4AA] text-base font-bold">?</span>
            </div>
            <div>
              <p className="text-[14px] font-bold text-white tracking-wide">Swap Complete!</p>
              <p className="text-xs text-white/50 font-mono mt-0.5">{amount} {tokenIn} ? {amount} {tokenOut}</p>
              <a
                href="https://testnet.arcscan.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#00D4AA] hover:underline mt-1.5 flex items-center gap-1 font-semibold"
              >
                View on Arcscan ?
              </a>
            </div>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            ?
          </button>
        </div>
      ), { duration: 6000 })

      setAmount('')
      refetchBalance()
    } catch (err: any) {
      setError(err.message || 'Swap failed. Please try again.')
      toast.error(err.message || 'Swap failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ y: 25, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-md mx-auto space-y-8"
    >
      <div className="mb-10 text-center">
        <div className="inline-flex p-5 rounded-[2rem] bg-white/[0.03] border border-white/10 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(108,92,231,0.1)] hover:border-[#00D4AA]/30/30 transition-all duration-500 font-bold">
          <ArrowDownUp className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 mb-3">Swap</h1>
        <p className="text-[12px] uppercase tracking-[0.25em] text-white/50 leading-relaxed font-medium">Exchange tokens instantly</p>
      </div>

      {!kitKey && (
        <div className="border border-amber-500/10 bg-amber-500/5 rounded-3xl p-6 flex gap-4 text-xs text-amber-300/90 font-light tracking-wide shadow-inner leading-relaxed">
          <AlertTriangle className="w-6 h-6 shrink-0 text-amber-400 animate-pulse mt-0.5" />
          <div className="space-y-2">
            <p className="font-extrabold text-amber-300 text-sm tracking-wide uppercase">?? Swap requires a free Circle Kit Key</p>
            <p>Get yours at <a href="https://console.circle.com" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-[#00D4AA]">console.circle.com</a> ? Keys ? Kit Keys</p>
            <p>Then add <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-white/95 border border-white/5">VITE_CIRCLE_KIT_KEY=your_key</span> to your environment.</p>
          </div>
        </div>
      )}

      <Card className="p-7 bg-[#09090B] border border-white/[0.06] shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4AA]/30 to-transparent transition-opacity opacity-50 group-hover:opacity-100" />
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#00D4AA]/[0.015] rounded-full blur-3xl pointer-events-none" />

        {/* Token In Section */}
        <div className="bg-black/40 border border-white/5 p-6 rounded-3xl relative">
          <label className="text-[11px] uppercase tracking-[0.15em] font-black text-white/40 mb-3 block">You Pay</label>
          <div className="flex items-center justify-between gap-4">
            <div className="w-1/2">
              <Input 
                type="number" 
                placeholder="0.00" 
                min="0.01" 
                step="0.01"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="border-none bg-transparent px-0 text-3xl font-mono focus:shadow-none !shadow-none w-full text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-transparent" 
              />
              <span className="text-[11px] text-white/45 block mt-2 font-sans font-medium">
                Available: <span className="font-mono text-white/80">{isBalanceLoading ? 'Loading...' : formattedBalance}</span> {tokenIn}
              </span>
            </div>
            <div className="flex items-center gap-2.5 bg-black/60 border border-white/10 hover:border-[#00D4AA]/30/40 p-2.5 pr-4 rounded-2xl transition-all duration-300">
              <TokenIcon symbol={tokenIn} />
              <select 
                className="bg-transparent border-none text-[13px] tracking-widest uppercase font-black text-white outline-none cursor-pointer appearance-none min-w-[75px] text-center font-mono font-bold"
                value={tokenIn}
                onChange={(e) => handleSetTokenIn(e.target.value)}
              >
                <option value="USDC" className="bg-[#09090B] text-white font-bold">USDC</option>
                <option value="EURC" className="bg-[#09090B] text-white font-bold">EURC</option>
                <option value="cirBTC" className="bg-[#09090B] text-white font-bold">cirBTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reverse Button Wrapper */}
        <div className="relative h-4 flex items-center justify-center my-3">
          <div className="absolute z-10 p-1 bg-[#09090B] rounded-xl border border-white/10 shadow-xl">
            <button 
              onClick={handleReverse}
              className="p-2 border border-white/15 rounded-lg hover:bg-[#00D4AA] text-white hover:text-black transition-all active:scale-95 bg-white/[0.03] flex items-center justify-center cursor-pointer hover:shadow-[0_0_15px_rgba(108,92,231,0.35)]"
              title="Swap tokens"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Token Out Section */}
        <div className="bg-black/40 border border-white/5 p-6 rounded-3xl relative mt-1">
          <label className="text-[11px] uppercase tracking-[0.15em] font-black text-white/40 mb-3 block">You Receive</label>
          <div className="flex items-center justify-between gap-4">
            <div className="w-1/2">
              <Input 
                type="text" 
                placeholder="0.00" 
                value={amount ? amount : '0.00'} 
                readOnly 
                className="border-none bg-transparent px-0 text-3xl font-mono focus:shadow-none !shadow-none w-full text-white/70 placeholder:text-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 cursor-not-allowed focus:bg-transparent" 
              />
              <span className="text-[11px] text-white/30 block mt-2 font-sans font-medium">
                Stablecoin rate near 1:1 on Arc Testnet
              </span>
            </div>
            <div className="flex items-center gap-2.5 bg-black/60 border border-white/10 hover:border-[#00D4AA]/30/40 p-2.5 pr-4 rounded-2xl transition-all duration-300">
              <TokenIcon symbol={tokenIn} />
              <select 
                className="bg-transparent border-none text-[13px] tracking-widest uppercase font-black text-white outline-none cursor-pointer appearance-none min-w-[75px] text-center font-mono font-bold"
                value={tokenOut}
                onChange={(e) => handleSetTokenOut(e.target.value)}
              >
                <option value="USDC" className="bg-[#09090B] text-white font-bold">USDC</option>
                <option value="EURC" className="bg-[#09090B] text-white font-bold">EURC</option>
                <option value="cirBTC" className="bg-[#09090B] text-white font-bold">cirBTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rate Preview */}
        <div className="space-y-1.5 py-4 px-2">
          <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] font-medium text-white/40">
            <span>Exchange Rate</span>
            <span className="font-mono text-white/70">1 USDC � 1 EURC</span>
          </div>
          <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] font-medium text-white/40 border-t border-white/5 pt-3">
            <span>Network</span>
            <span className="font-mono text-white/70">Arc Testnet</span>
          </div>
        </div>

        {/* Swap Button and Status */}
        <div className="space-y-4">
          {!address ? (
            <div className="flex justify-center w-full">
              <div className="w-full shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_35px_rgba(255,255,255,0.1)] transition-all rounded-2xl overflow-hidden [&>button]:w-full [&_button]:!w-full [&_button]:!h-14 [&_button]:!rounded-2xl">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => {
                    return (
                      <Button
                        onClick={openConnectModal}
                        className="w-full h-14 bg-white text-black hover:bg-neutral-200 uppercase tracking-widest font-bold text-xs"
                      >
                        Connect Wallet
                      </Button>
                    )
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          ) : !kitKey ? (
            <div>
              <Button 
                className="w-full h-14 bg-white/5 text-white/30 border border-white/5 cursor-not-allowed uppercase tracking-widest font-bold text-xs" 
                size="lg" 
                disabled
              >
                Setup Required
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleSwap}
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
                  <span>Swapping...</span>
                </div>
              ) : (
                `Swap ${tokenIn} ? ${tokenOut}`
              )}
            </Button>
          )}

          {error && (
            error.includes('not available in this preview') ? (
              <div className="p-5 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl mt-4 text-center space-y-3 shadow-[0_0_20px_rgba(99,102,241,0.05)]">
                <p className="text-indigo-300 text-sm font-semibold tracking-wide flex items-center justify-center gap-1.5 uppercase">
                  ? Swap works in your local browser
                </p>
                <p className="text-white/60 text-xs leading-relaxed max-w-xs mx-auto">
                  This preview environment can't load the Circle Swap SDK. Run the app locally:
                </p>
                <div className="font-mono bg-black/50 border border-indigo-500/20 text-indigo-300 text-xs py-1.5 px-3 rounded-lg inline-block font-semibold">
                  npm run dev
                </div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">
                  Then swap works fully with MetaMask.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mt-2 text-center">
                <p className="text-red-400 text-xs font-sans whitespace-pre-line leading-relaxed font-semibold">{error}</p>
              </div>
            )
          )}
        </div>

        {/* Collapsible Key Setup */}
        <div className="border-t border-white/5 pt-4 mt-6">
          <button 
            type="button"
            onClick={() => setShowKeySetup(!showKeySetup)}
            className="text-[10px] uppercase tracking-[0.15em] font-bold text-white/30 hover:text-white/60 transition-colors flex items-center gap-2 outline-none mx-auto cursor-pointer"
          >
            ?|?? {kitKey ? 'Update Circle Kit Key' : 'Configure Circle Kit Key'}
          </button>
          
          {showKeySetup && (
            <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <p className="text-[11px] text-white/40 leading-relaxed text-center">
                Paste your Circle Kit Key here. Find your key at{' '}
                <a 
                  href="https://console.circle.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[#00D4AA] hover:underline font-semibold"
                >
                  console.circle.com
                </a>
              </p>
              <div className="flex gap-2">
                <Input 
                  type="password" 
                  placeholder="Paste Kit Key here" 
                  value={typedKey} 
                  onChange={(e) => setTypedKey(e.target.value)} 
                  className="bg-black/40 border-white/5 text-xs !py-3 !px-4"
                />
                <Button 
                  onClick={handleSaveKey}
                  className="bg-[#00D4AA] hover:bg-[#7d70f0] text-black text-xs font-bold px-4 rounded-xl shrink-0"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <a 
        href="https://console.circle.com" 
        target="_blank" rel="noopener noreferrer"
        className="block text-center text-[10px] uppercase tracking-widest text-[#00D4AA]/40 hover:text-[#00D4AA] transition-colors py-4 font-semibold"
      >
        Get your free key at console.circle.com ?
      </a>
    </motion.div>
  )
}
