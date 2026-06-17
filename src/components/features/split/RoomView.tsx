import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Zap, CheckCircle, Loader2, X } from 'lucide-react'
import { supabase } from '../../../config/supabase'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Spinner } from '../../ui/Spinner'
import { ExpenseRow } from './ExpenseRow'
import { useSendUsdc } from '../../../hooks/useSendUsdc'
import { saveTransaction } from '../../../hooks/useTransactions'
import { BackButton } from '../../BackButton'
import { toast } from 'react-hot-toast'
import type { SplitRoom, SplitExpense } from '../../../types'

export function RoomView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { address } = useAccount()
  const { send, isPending, isSuccess, hash, explorerUrl } = useSendUsdc()

  const [room, setRoom] = useState<SplitRoom | null>(null)
  const [localExpenses, setLocalExpenses] = useState<SplitExpense[]>([])
  const [settledDebts, setSettledDebts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(address || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Track settling specific debt
  const [activeWaitFrom, setActiveWaitFrom] = useState('')
  const [activeWaitTo, setActiveWaitTo] = useState('')
  const [activeWaitAmt, setActiveWaitAmt] = useState(0)

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setIsLoading(true);
      if (supabase) {
        // First - fetch room
        const { data: rData } = await supabase.from('rooms').select('*').eq('id', id).single()
        if (rData) setRoom(rData as SplitRoom)
        
        // Second - fetch expenses
        const { data: eData } = await supabase.from('expenses').select('*').eq('room_id', id)
        if (eData) setLocalExpenses(eData as SplitExpense[])
        
        // Third - fetch settlements
        const { data: sData } = await supabase.from('settlements').select('*').eq('room_id', id)
        if (sData) {
          const settledSet = new Set<string>()
          sData.forEach((s: any) => {
            const from = s.debtor || s.from_address || ''
            const to = s.creditor || s.to_address || ''
            if (from && to) settledSet.add(`${from.toLowerCase()}-${to.toLowerCase()}`)
          })
          setSettledDebts(settledSet)
        }
      } else {
        // Fallback for local storage
        try {
          const lsR = localStorage.getItem('payzap_rooms')
          const rList = lsR ? JSON.parse(lsR) : []
          const r = rList.find((x: any) => x.id === id)
          if (r) setRoom(r)

          const lsE = localStorage.getItem(`payzap_expenses_${id}`)
          const eList = lsE ? JSON.parse(lsE) : []
          setLocalExpenses(eList)

          const lsS = localStorage.getItem(`payzap_settlements_${id}`)
          const sList = lsS ? JSON.parse(lsS) : []
          const settledSet = new Set<string>()
          sList.forEach((s: any) => {
            const from = s.debtor || s.from_address || ''
            const to = s.creditor || s.to_address || ''
            if (from && to) settledSet.add(`${from.toLowerCase()}-${to.toLowerCase()}`)
          })
          setSettledDebts(settledSet)
        } catch(e) {}
      }
      setIsLoading(false);
    }
    
    loadData();

    if (!supabase) return;

    const channel = supabase
      ?.channel(`room_${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'settlements', filter: `room_id=eq.${id}` },
        (payload) => {
          const s = payload.new as any;
          setSettledDebts(prev => {
            const next = new Set(prev)
            const from = s.debtor || s.from_address || ''
            const to = s.creditor || s.to_address || ''
            if (from && to) next.add(`${from.toLowerCase()}-${to.toLowerCase()}`)
            return next
          })
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase?.removeChannel(channel)
    }
  }, [id])

  useEffect(() => {
    if (isSuccess && hash && activeWaitFrom && activeWaitTo) {
      const handleSettleDone = async () => {
        try {
          const newSettlement = {
            id: crypto.randomUUID(),
            room_id: id!,
            debtor: activeWaitFrom.toLowerCase(),
            creditor: activeWaitTo.toLowerCase(),
            amount: activeWaitAmt,
            tx_hash: hash,
            settled_at: new Date().toISOString()
          }

          const splitTx = {
            id: crypto.randomUUID(),
            wallet: activeWaitFrom.toLowerCase(),
            type: 'split' as const,
            to_address: activeWaitTo.toLowerCase(),
            from_address: activeWaitFrom.toLowerCase(),
            amount: activeWaitAmt.toFixed(2),
            description: 'Split settlement',
            room_name: room?.name || 'Split Room',
            tx_hash: hash,
            timestamp: Date.now()
          }

          if (supabase) {
            const { error } = await supabase.from('settlements').insert([newSettlement])
            if (error) {
              console.error("Error creating settlement:", error)
            } else {
              const { error: txErr } = await supabase.from('transactions').insert([splitTx])
              if (txErr) console.error('Transaction save failed:', txErr.message)

              setSettledDebts(prev => {
                const next = new Set(prev)
                next.add(`${activeWaitFrom.toLowerCase()}-${activeWaitTo.toLowerCase()}`)
                return next
              })
              toast.success("? Debt settled! Transaction confirmed.")
            }
          } else {
            const ls = localStorage.getItem(`payzap_settlements_${id}`)
            const list = ls ? JSON.parse(ls) : []
            list.push({ ...newSettlement, id: crypto.randomUUID() })
            localStorage.setItem(`payzap_settlements_${id}`, JSON.stringify(list))
            
            setSettledDebts(prev => {
              const next = new Set(prev)
              next.add(`${activeWaitFrom.toLowerCase()}-${activeWaitTo.toLowerCase()}`)
              return next
            })
            toast.success("? Debt settled! Transaction confirmed.")
          }

          try {
            const existing = localStorage.getItem('payzap_transactions')
            const array = existing ? JSON.parse(existing) : []
            array.push(splitTx)
            localStorage.setItem('payzap_transactions', JSON.stringify(array))
          } catch (err) {
            console.error('LocalStorage save failed:', err)
          }
          
          setActiveWaitFrom('')
          setActiveWaitTo('')
          setActiveWaitAmt(0)
        } catch (e) {
          console.error(e)
        }
      }
      handleSettleDone()
    }
  }, [isSuccess, hash, activeWaitFrom, activeWaitTo, activeWaitAmt, id, room])

  if (isLoading) return <div className="p-12 flex justify-center"><Spinner size="lg" /></div>
  if (!room) return <div className="p-12 text-center text-textSecondary">Room not found</div>

  const handleAddExpense = async () => {
    if (!desc || !amount || !paidBy) return
    setIsSubmitting(true)
    
    const newExpense = {
      id: crypto.randomUUID(),
      room_id: room.id,
      description: desc,
      amount: parseFloat(amount),
      paid_by: paidBy.toLowerCase(),
      created_at: new Date().toISOString()
    }
    
    try {
      if (supabase) {
        const { error } = await supabase.from('expenses').insert([newExpense])
        if (error) {
          console.error("Error adding expense:", error)
          const ls = localStorage.getItem(`payzap_expenses_${room.id}`)
          const storedExps = ls ? JSON.parse(ls) : []
          storedExps.push(newExpense)
          localStorage.setItem(`payzap_expenses_${room.id}`, JSON.stringify(storedExps))
        }
      } else {
        const ls = localStorage.getItem(`payzap_expenses_${room.id}`)
        const storedExps = ls ? JSON.parse(ls) : []
        storedExps.push(newExpense)
        localStorage.setItem(`payzap_expenses_${room.id}`, JSON.stringify(storedExps))
      }
      
      setLocalExpenses(prev => [...prev, newExpense as any])
      setDesc('')
      setAmount('')
      setPaidBy(address || room.members[0] || '')
    } catch(e) { 
      console.error(e) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  // Calculate debts
  const balances: Record<string, number> = {}
  room.members.forEach(m => balances[m.toLowerCase()] = 0)

  localExpenses.forEach(exp => {
    const pBy = exp.paid_by.toLowerCase()
    if (balances[pBy] !== undefined) balances[pBy] += Number(exp.amount)
    const splitCount = room.members.length
    const share = Number(exp.amount) / splitCount
    room.members.forEach(m => {
      const mbr = m.toLowerCase()
      if (balances[mbr] !== undefined) balances[mbr] -= share
    })
  })

  // Settle algorithm simplistic greedy
  const debtors = Object.entries(balances).filter(([m,b]) => b < -0.01).sort((a,b) => a[1]-b[1])
  const creditors = Object.entries(balances).filter(([m,b]) => b > 0.01).sort((a,b) => b[1]-a[1])
  
  const settlements = []
  let i=0, j=0;
  while(i < debtors.length && j < creditors.length) {
    const owe = -debtors[i][1]
    const get = creditors[j][1]
    const amt = Math.min(owe, get)
    
    settlements.push({ from: debtors[i][0], to: creditors[j][0], amount: amt })
    
    debtors[i][1] += amt
    creditors[j][1] -= amt
    if (-debtors[i][1] < 0.01) i++
    if (creditors[j][1] < 0.01) j++
  }

  const truncateAddress = (addr: string) => `${addr.slice(0,6)}...${addr.slice(-4)}`;

  const isAllSettled = settlements.length > 0 && settlements.filter(s => !settledDebts.has(`${s.from.toLowerCase()}-${s.to.toLowerCase()}`)).length === 0;

  const handleDeleteRoom = async () => {
    if (!room) return;
    if (room.created_by?.toLowerCase() !== address?.toLowerCase()) {
      toast.error("Only the room creator can delete this room.")
      return;
    }
    try {
      if (supabase) {
        await supabase.from('rooms').delete().eq('id', room.id)
      } else {
        const lsR = localStorage.getItem('payzap_rooms')
        if (lsR) {
          const rList = JSON.parse(lsR)
          localStorage.setItem('payzap_rooms', JSON.stringify(rList.filter((r: any) => r.id !== room.id)))
        }
      }
      navigate('/split')
    } catch(e) { console.error(e) }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      if (supabase) {
        await supabase.from('expenses').delete().eq('id', expenseId)
      } else {
        const ls = localStorage.getItem(`payzap_expenses_${room?.id}`)
        if (ls) {
          const storedExps = JSON.parse(ls)
          localStorage.setItem(`payzap_expenses_${room?.id}`, JSON.stringify(storedExps.filter((e: any) => e.id !== expenseId)))
        }
      }
      setLocalExpenses(prev => prev.filter(e => e.id !== expenseId))
    } catch(e) { console.error(e) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:px-0 px-4 mt-6 md:mt-0">
      <BackButton onClick={() => navigate('/split')} />
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-light tracking-[0.2em] uppercase text-white">{room.name}</h1>
          <p className="text-white/50 mt-2 font-semibold text-xs tracking-widest uppercase">{room.members.length} members</p>
        </div>
      </div>

      {isAllSettled && (
        <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30/20 rounded-3xl p-6 flex sm:flex-row flex-col items-center justify-between gap-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D4AA]/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#00D4AA]/20 blur-3xl opacity-50 pointer-events-none" />
          
          <div className="flex items-center gap-5 relative z-10 w-full sm:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#00D4AA]/10 flex items-center justify-center border border-[#00D4AA]/30/20 shadow-[0_0_20px_rgba(108,92,231,0.15)] flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-[#00D4AA]" />
            </div>
            <div>
              <p className="text-[#00D4AA] font-bold font-sans tracking-tight text-xl mb-1">Room Complete</p>
              <p className="text-[#00D4AA]/60 text-[13px] font-medium tracking-wide">All debts have been successfully settled.</p>
            </div>
          </div>
          {room.created_by?.toLowerCase() === address?.toLowerCase() && (
            <button 
              onClick={handleDeleteRoom} 
              className="relative z-10 w-full sm:w-auto px-8 py-3.5 bg-white text-black hover:bg-[#e5e5e5] font-bold text-[11px] uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] whitespace-nowrap"
            >
              Delete Room
            </button>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-[#09090B] border border-white/5 shadow-2xl p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity opacity-50 group-hover:opacity-100" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="uppercase tracking-[0.2em] font-bold text-[11px] mb-8 text-white/40 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              Add Expense
            </h3>
             <div className="flex flex-col gap-6 relative z-10">
               <div>
                 <Input className="w-full focus:border-[#00D4AA]/30/70 text-[15px] font-medium tracking-wide" placeholder="What was this for?" value={desc} onChange={e=>setDesc(e.target.value)} />
               </div>
               <div className="flex sm:flex-row flex-col gap-5">
                 <div className="w-full sm:w-[45%]">
                   <label className="block uppercase tracking-[0.15em] font-black text-[11px] mb-3 text-white/40 ml-1">Amount (USDC)</label>
                   <div className="relative">
                     <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/35 font-mono pointer-events-none font-bold">$</span>
                     <Input className="w-full font-mono !pl-10 text-white focus:border-[#00D4AA]/30/70 text-lg" placeholder="0.00" type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} />
                   </div>
                 </div>
                 <div className="w-full sm:w-[55%]">
                   <label className="block uppercase tracking-[0.15em] font-black text-[11px] mb-3 text-white/40 ml-1">Paid by</label>
                   <select 
                     className="w-full bg-black/60 !py-4 px-5 rounded-2xl border border-white/15 hover:border-white/30 focus:border-[#00D4AA]/30 focus:ring-1 focus:ring-[#00D4AA]/20 transition-all text-white text-[13px] outline-none appearance-none font-mono tracking-wide cursor-pointer font-bold select-none h-[56px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                     value={paidBy}
                     onChange={e => setPaidBy(e.target.value)}
                   >
                     <option value="" disabled className="bg-[#09090B] font-bold">Select member</option>
                     {room.members.map(member => (
                       <option key={member} value={member} className="bg-[#09090B] py-2 font-bold">
                         {truncateAddress(member)} {member.toLowerCase() === address?.toLowerCase() ? '(You)' : ''}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
               <Button onClick={handleAddExpense} disabled={!desc || !amount || !paidBy || isSubmitting} className="w-full shrink-0 mt-4 bg-white hover:bg-[#e5e5e5] text-black !rounded-2xl !py-4 uppercase tracking-[0.15em] font-bold text-[11px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50 disabled:hover:shadow-none" size="sm">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-black" /> : 'ADD EXPENSE'}
               </Button>
             </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="uppercase tracking-[0.2em] font-bold text-[11px] mb-6 text-white/40 flex items-center gap-3 ml-2">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              Expenses Activity
            </h3>
            <div className="space-y-3">
              {localExpenses.map((e: any) => (
                <ExpenseRow 
                  key={e.id} 
                  expense={e} 
                  isCreator={room.created_by?.toLowerCase() === address?.toLowerCase()} 
                  splitCount={room.members.length} 
                  currentAddress={address}
                  onDelete={() => handleDeleteExpense(e.id)} 
                />
              ))}
              {localExpenses.length === 0 && (
                <div className="bg-white/[0.02] border border-white/[0.05] border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                    <span className="text-white/20 text-lg">??</span>
                  </div>
                  <p className="text-white/40 text-[13px] font-sans tracking-wide">No expenses added yet.</p>
                  <p className="text-white/20 text-[11px] font-sans">Add your first expense above to start tracking.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#09090B] border border-white/5 p-8 shadow-2xl rounded-3xl relative overflow-hidden group h-full min-h-[500px]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4AA]/20 to-transparent transition-opacity opacity-50 group-hover:opacity-100" />
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#00D4AA]/[0.015] rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="uppercase tracking-[0.2em] font-bold text-[11px] mb-8 flex items-center gap-3 text-white/40">
              <Zap className="w-3.5 h-3.5 text-[#00D4AA]" /> Debts to Settle
            </h3>
            
            <div className="space-y-4 relative z-10">
              {settlements.map((s, idx) => {
                const settledKey = `${s.from.toLowerCase()}-${s.to.toLowerCase()}`
                const isSettled = settledDebts.has(settledKey)
                
                return (
                  <div key={idx} className="bg-[#09090B] p-[20px_24px] rounded-2xl border border-white/5 shadow-lg relative group transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02]">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-[#00D4AA]/5 to-transparent blur-xl" />
                    
                    <div className="relative z-10 flex flex-col gap-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">From</span>
                        <span className="font-mono text-[13px] text-white/70 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">{truncateAddress(s.from)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">To</span>
                        <span className="font-mono text-[13px] text-white/70 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">{truncateAddress(s.to)}</span>
                      </div>
                    </div>
                    
                    <div className="relative z-10 flex justify-between items-center mt-5 border-t border-white/5 pt-5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-sans font-bold text-[28px] tracking-tight text-[#00D4AA]">{s.amount.toFixed(2)}</span>
                        <span className="text-[11px] text-[#00D4AA]/50 font-bold tracking-widest uppercase">USDC</span>
                      </div>
                      
                      {isSettled ? (
                        <div className="px-4 py-2 bg-[#00D4AA]/10 text-[#00D4AA] text-[11px] font-bold tracking-widest uppercase rounded-full border border-[#00D4AA]/30/20 flex items-center gap-2">
                           <CheckCircle className="w-3.5 h-3.5" />
                           <span>SETTLED</span>
                        </div>
                      ) : address?.toLowerCase() === s.from.toLowerCase() ? (
                        <button 
                          onClick={() => {
                            setActiveWaitFrom(s.from)
                            setActiveWaitTo(s.to)
                            setActiveWaitAmt(s.amount)
                            send(s.to, s.amount.toFixed(2))
                          }}
                          disabled={(isPending && activeWaitFrom === s.from) || false}
                          className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border border-transparent shadow-[0_0_20px_rgba(108,92,231,0.1)] hover:shadow-[0_0_30px_rgba(108,92,231,0.25)] ${(isPending && activeWaitFrom === s.from) ? 'bg-[#00D4AA]/20 text-[#00D4AA] cursor-not-allowed shadow-none hover:shadow-none' : 'bg-[#00D4AA] text-white hover:bg-[#7d70f0]'}`}
                        >
                          {(isPending && activeWaitFrom === s.from) ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>CONFIRMING</span>
                            </div>
                          ) : 'SETTLE'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
              {localExpenses.length === 0 ? (
                <div className="bg-white/[0.02] border border-white/[0.05] border-dashed rounded-3xl p-8 text-center mt-4">
                  <p className="text-[13px] text-white/40 font-medium tracking-wide">Add an expense to start calculating debts.</p>
                </div>
              ) : settlements.filter(s => !settledDebts.has(`${s.from.toLowerCase()}-${s.to.toLowerCase()}`)).length === 0 ? (
                <div className="bg-[#00D4AA]/5 border border-[#00D4AA]/30/10 rounded-3xl p-8 text-center flex flex-col items-center gap-3 mt-4">
                  <CheckCircle className="w-8 h-8 text-[#00D4AA]" />
                  <p className="text-[14px] text-[#00D4AA] font-bold tracking-wide">All settled up!</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

