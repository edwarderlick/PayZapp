import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../config/supabase'
import type { Transaction } from '../types'

const LS_KEY = (addr: string) => `payzap_history_${addr.toLowerCase()}`
const LS_LEGACY = 'payzap_transactions'
const TX_EVENT = 'payzap:tx-saved'

function saveToLocalStorage(tx: Transaction & Record<string, any>) {
  try {
    if (tx.wallet) {
      const key = LS_KEY(tx.wallet)
      const raw = localStorage.getItem(key)
      const list: Transaction[] = raw ? JSON.parse(raw) : []
      list.unshift(tx)
      localStorage.setItem(key, JSON.stringify(list.slice(0, 100)))
    }
    const raw2 = localStorage.getItem(LS_LEGACY)
    const list2: Transaction[] = raw2 ? JSON.parse(raw2) : []
    list2.unshift(tx)
    localStorage.setItem(LS_LEGACY, JSON.stringify(list2.slice(0, 100)))
    window.dispatchEvent(new CustomEvent(TX_EVENT))
  } catch (e) {
    console.error('localStorage write failed', e)
  }
}

export function useTransactions(address?: string) {
  const [data, setData] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTxs = useCallback(async () => {
    if (!address) {
      setData([])
      setIsLoading(false)
      return
    }

    const byId = new Map<string, Transaction>()

    // Always read localStorage first — guaranteed to have all local transactions
    try {
      const raw = localStorage.getItem(LS_KEY(address))
      const keyed: Transaction[] = raw ? JSON.parse(raw) : []
      const raw2 = localStorage.getItem(LS_LEGACY)
      const legacy: Transaction[] = raw2 ? JSON.parse(raw2) : []
      const walletLower = address.toLowerCase()
      const legacyFiltered = legacy.filter((t) => t.wallet?.toLowerCase() === walletLower)
      ;[...keyed, ...legacyFiltered].forEach((t) => byId.set(t.id, t))
    } catch {}

    // Also try Supabase and MERGE (never short-circuit — Supabase may have extra synced txs)
    if (supabase) {
      try {
        const { data: txs, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet', address.toLowerCase())
          .order('timestamp', { ascending: false })
          .limit(100)

        if (!error && txs) {
          txs.forEach((t: any) => byId.set(t.id, t as Transaction))
        }
      } catch {}
    }

    const merged = Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp)
    setData(merged.slice(0, 100))
    setIsLoading(false)
  }, [address])

  useEffect(() => {
    fetchTxs()

    window.addEventListener(TX_EVENT, fetchTxs)

    const channel = supabase
      ?.channel('tx-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchTxs)
      .subscribe()

    return () => {
      window.removeEventListener(TX_EVENT, fetchTxs)
      if (channel) supabase?.removeChannel(channel)
    }
  }, [fetchTxs])

  return { data, isLoading, refetch: fetchTxs }
}

export async function saveTransaction(tx: Omit<Transaction, 'id' | 'timestamp'> & Record<string, any>) {
  const fullTx: Transaction & Record<string, any> = {
    ...tx,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    wallet: tx.wallet?.toLowerCase() ?? '',
  }

  // Always persist locally first — guaranteed path regardless of Supabase
  saveToLocalStorage(fullTx)

  if (supabase) {
    try {
      const { error } = await supabase.from('transactions').insert([fullTx])
      if (error) {
        const isConstraint = error.code === '23514' || error.message?.toLowerCase().includes('check')
        if (isConstraint) {
          console.error(
            `[PayZapp] Supabase schema outdated — the "transactions" table has a CHECK constraint that rejects "${fullTx.type}" type.\n` +
            `Fix: run the OPTION A migration SQL from src/config/supabase.ts in your Supabase SQL Editor.\n` +
            `Transaction was saved to localStorage and will appear in History.`
          )
        } else {
          console.warn('[PayZapp] Supabase insert failed (saved to localStorage):', error.message)
        }
      }
    } catch (err) {
      console.warn('[PayZapp] Supabase insert threw:', err)
    }
  }

  return fullTx
}
