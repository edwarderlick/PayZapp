export type Transaction = {
  id: string
  wallet: string
  type: 'send' | 'split' | 'receive' | 'bridge' | 'swap' | 'vault_deposit' | 'vault_spend'
  to_address: string
  from_address: string
  amount: string
  description: string
  room_name?: string
  tx_hash: string
  timestamp: number
  from_chain?: string
  to_chain?: string
  token_in?: string
  token_out?: string
  explorer_url?: string
}

export type SplitRoom = {
  id: string
  name: string
  created_by: string
  members: string[]
  is_settled: boolean
  created_at: string
}

export type SplitExpense = {
  id: string
  room_id: string
  description: string
  amount: number
  paid_by: string
  created_at: string
}

export type SplitSettlement = {
  id: string
  room_id: string
  from_address: string
  to_address: string
  amount: number
  tx_hash: string | null
  settled: boolean
  created_at: string
}
