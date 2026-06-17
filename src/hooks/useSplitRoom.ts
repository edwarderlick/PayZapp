import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'
import type { SplitRoom, SplitExpense } from '../types'

export function useSplitRooms(address?: string) {
  const [rooms, setRooms] = useState<SplitRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabase || !address) {
      if (!supabase) {
        try {
          const ls = localStorage.getItem('payzap_rooms')
          setRooms(ls ? JSON.parse(ls) : [])
        } catch { }
      }
      setIsLoading(false)
      return
    }

    const fetchRooms = async () => {
      try {
        const { data, error } = await supabase!
          .from('rooms')
          .select('*')
          .contains('members', [address])
          .order('created_at', { ascending: false })
        if (!error && data) setRooms(data as SplitRoom[])
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRooms()
  }, [address])

  return { rooms, isLoading }
}

export function useSplitRoom(roomId: string) {
  const [room, setRoom] = useState<SplitRoom | null>(null)
  const [expenses, setExpenses] = useState<SplitExpense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      try {
        const lsR = localStorage.getItem('payzap_rooms')
        const rList = lsR ? JSON.parse(lsR) : []
        const r = rList.find((x: any) => x.id === roomId)
        if (r) setRoom(r)

        const lsE = localStorage.getItem(`payzap_expenses_${roomId}`)
        const eList = lsE ? JSON.parse(lsE) : []
        setExpenses(eList)
      } catch {}
      setIsLoading(false)
      return
    }

    const fetchRoom = async () => {
      try {
        const { data: rData } = await supabase!.from('rooms').select('*').eq('id', roomId).single()
        if (rData) setRoom(rData as SplitRoom)

        const { data: eData, error } = await supabase!.from('expenses').select('*').eq('room_id', roomId)
        if (eData) {
          setExpenses(eData as SplitExpense[])
        } else {
          try {
            const lsE = localStorage.getItem(`payzap_expenses_${roomId}`)
            if (lsE) setExpenses(JSON.parse(lsE))
          } catch {}
        }
      } catch (e) {
        console.error(e)
        const lsE = localStorage.getItem(`payzap_expenses_${roomId}`)
        if (lsE) setExpenses(JSON.parse(lsE))
      } finally {
        setIsLoading(false)
      }
    }
    fetchRoom()
  }, [roomId])

  return { room, expenses, isLoading }
}

export async function createLocalRoom(name: string, members: string[], address: string) {
  const id = crypto.randomUUID()
  const room = { id, name, created_by: address, members, is_settled: false, created_at: new Date().toISOString() }
  const ls = localStorage.getItem('payzap_rooms')
  const rooms = ls ? JSON.parse(ls) : []
  rooms.push(room)
  localStorage.setItem('payzap_rooms', JSON.stringify(rooms))
  return id
}

export async function createLocalExpense(roomId: string, desc: string, amt: number, paidBy: string) {
  const id = crypto.randomUUID()
  const exp = { id, room_id: roomId, description: desc, amount: amt, paid_by: paidBy, created_at: new Date().toISOString() }
  const ls = localStorage.getItem(`payzap_expenses_${roomId}`)
  const expenses = ls ? JSON.parse(ls) : []
  expenses.push(exp)
  localStorage.setItem(`payzap_expenses_${roomId}`, JSON.stringify(expenses))
  return id
}
