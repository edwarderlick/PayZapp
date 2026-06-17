import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { isAddress, parseUnits } from 'viem'
import { useSendUsdc } from '../../../hooks/useSendUsdc'
import { useUsdcBalance } from '../../../hooks/useUsdcBalance'
import { showTxToast } from '../../ui/TxToast'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { supabase } from '../../../config/supabase'

export function SendPanel() {
  const { address } = useAccount()
  const { formatted, raw, refetch } = useUsdcBalance(address)
  const { send, isPending, isConfirming, isSuccess, error, hash, explorerUrl } = useSendUsdc()

  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')

  const isValidAddress = isAddress(toAddress)
  const isAmountValid = Number(amount) > 0 && (!raw || parseAmount(amount) <= raw)
  const canSubmit = isValidAddress && isAmountValid && !isPending && !isConfirming

  useEffect(() => {
    if (isSuccess && hash && explorerUrl && address) {
      showTxToast(hash, explorerUrl)

      const handleSave = async () => {
        const senderTx = {
          id: crypto.randomUUID(),
          wallet: address.toLowerCase(),
          type: 'send' as const,
          to_address: toAddress.toLowerCase(),
          from_address: address.toLowerCase(),
          amount,
          description: 'USDC Transfer',
          room_name: null,
          tx_hash: hash,
          timestamp: Date.now()
        }
        const recipientTx = {
          id: crypto.randomUUID(),
          wallet: toAddress.toLowerCase(),
          type: 'receive' as const,
          to_address: toAddress.toLowerCase(),
          from_address: address.toLowerCase(),
          amount,
          description: 'USDC Transfer',
          room_name: null,
          tx_hash: hash,
          timestamp: Date.now()
        }
        if (supabase) {
          await supabase.from('transactions').insert([senderTx])
          await supabase.from('transactions').insert([recipientTx])
        }
        try {
          const existing = localStorage.getItem('payzap_transactions')
          const array = existing ? JSON.parse(existing) : []
          array.push(senderTx, recipientTx)
          localStorage.setItem('payzap_transactions', JSON.stringify(array))
        } catch {}
      }

      handleSave()
      refetch()
      setTimeout(() => { setToAddress(''); setAmount('') }, 3000)
    }
  }, [isSuccess, hash, explorerUrl, address, amount, toAddress, refetch])

  const handleSend = () => { if (canSubmit) send(toAddress, amount) }
  const handleMax = () => setAmount(formatted)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8"
    >
      {/* Main form — 8 cols */}
      <div className="md:col-span-8 flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#e5e0ed] tracking-tight">Send USDC</h2>
          <p className="text-[rgba(255,255,255,0.4)] mt-1">Transfer digital assets securely across decentralized networks.</p>
        </div>

        {/* Glass transaction card */}
        <div className="glass-card p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
          {/* Decorative corner glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#00D4AA]/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Recipient */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[rgba(255,255,255,0.4)]">Recipient Wallet Address</label>
            <div className="relative">
              <Input
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono pr-12 text-sm"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.4)] text-lg">
                {toAddress ? (isValidAddress ? 'check_circle' : 'cancel') : 'qr_code_scanner'}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-[rgba(255,255,255,0.4)]">Amount to Send</label>
              <span className="text-xs text-[#c8c4d7]">Balance: <span className="font-geist font-medium text-[#00D4AA]">{formatted} USDC</span></span>
            </div>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="font-geist text-2xl pr-28"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={handleMax}
                  className="px-2.5 py-1 bg-[#2a2932] rounded text-xs font-semibold text-[#00D4AA] hover:bg-[#35343d] transition-colors"
                >
                  MAX
                </button>
                <div className="flex items-center gap-1 px-2 py-1 bg-[#00D4AA]/15 rounded border border-[#00D4AA]/25">
                  <div className="w-4 h-4 rounded-full bg-[#2775ca] flex items-center justify-center text-[9px] font-bold text-white">$</div>
                  <span className="text-xs font-bold text-[#00D4AA]">USDC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fee summary */}
          <div className="pt-4 border-t border-[rgba(146,142,160,0.15)] flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[rgba(255,255,255,0.4)]">Network Fee (Estimated)</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#00D4AA] text-sm">bolt</span>
                <span className="text-[#e5e0ed] font-geist">~ 0.01 USDC</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[rgba(255,255,255,0.4)]">Estimated Arrival</span>
              <span className="text-[#c8c4d7]">~ 30 seconds</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
              {error.message.split('\n')[0]}
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            {isPending ? (
              <><Spinner size="sm" /><span>Confirm in Wallet...</span></>
            ) : isConfirming ? (
              <><Spinner size="sm" /><span>Sending...</span></>
            ) : isSuccess ? (
              <><span className="material-symbols-outlined text-base">check_circle</span><span>Sent Successfully</span></>
            ) : (
              <><span>Send Funds</span><span className="material-symbols-outlined text-base">send</span></>
            )}
          </Button>
        </div>
      </div>

      {/* Sidebar — 4 cols */}
      <aside className="md:col-span-4 flex flex-col gap-4">
        <div className="glass-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#e5e0ed]">Recent Contacts</h3>
            <button className="material-symbols-outlined text-[rgba(255,255,255,0.4)] hover:text-[#00D4AA] transition-colors text-xl">add</button>
          </div>
          <div className="flex flex-col gap-1">
            {[
              { name: 'Arc Wallet', addr: '0x71C...4e92' },
              { name: 'Bridge Test', addr: '0x3A2...9b11' },
              { name: 'Vault Fund',  addr: '0x1F9...d820' },
            ].map(({ name, addr }) => (
              <button
                key={addr}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[rgba(53,52,61,0.4)] transition-all text-left group"
                onClick={() => setToAddress('')}
              >
                <div className="w-9 h-9 rounded-full bg-[#00D4AA]/20 border border-[#00D4AA]/30 flex items-center justify-center text-[#00D4AA] font-bold text-sm shrink-0">
                  {name[0]}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-[#e5e0ed] group-hover:text-[#00D4AA] transition-colors">{name}</span>
                  <span className="text-[10px] font-geist text-[rgba(255,255,255,0.4)]">{addr}</span>
                </div>
                <span className="material-symbols-outlined ml-auto text-[rgba(255,255,255,0.4)] group-hover:text-[#00D4AA] opacity-0 group-hover:opacity-100 transition-all text-base">arrow_forward</span>
              </button>
            ))}
          </div>
        </div>

        {/* Network info */}
        <div className="glass-card p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#e5e0ed]">Network</h3>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D4AA] shadow-[0_0_8px_#00D4AA]" />
            <span className="text-sm text-[#c8c4d7]">Arc Testnet</span>
            <span className="ml-auto text-[10px] font-geist text-[rgba(255,255,255,0.4)]">Chain 5042002</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[rgba(255,255,255,0.4)] text-sm">bolt</span>
            <span className="text-xs text-[rgba(255,255,255,0.4)]">Gas: ~0.01 USDC</span>
          </div>
        </div>
      </aside>
    </motion.div>
  )
}

function parseAmount(val: string) {
  try { return parseUnits(val || '0', 6) } catch { return 0n }
}
