import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { createLocalRoom } from '../../../hooks/useSplitRoom'
import { supabase } from '../../../config/supabase'

export function CreateRoomModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address } = useAccount()
  const navigate = useNavigate()
  
  const [name, setName] = useState('')
  const [members, setMembers] = useState<string[]>([])
  const [newMember, setNewMember] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberError, setMemberError] = useState('')

  // Auto-add creator on mount if not in list
  if (address && !members.includes(address) && members.length === 0) {
    setMembers([address])
  }

  const handleAddMember = () => {
    setMemberError('')
    if (!newMember.startsWith('0x') || newMember.length !== 42) {
      setMemberError('Invalid wallet address')
      return
    }
    if (isAddress(newMember)) {
      if (!members.includes(newMember)) {
        setMembers([...members, newMember])
      }
      setNewMember('')
    } else {
      setMemberError('Invalid wallet address')
    }
  }

  const handleCreate = async () => {
    if (!name || members.length < 1 || !address) return
    setIsSubmitting(true)
    
    try {
      if (supabase) {
        const { data, error } = await supabase.from('rooms').insert([{
          id: crypto.randomUUID(),
          name,
          members,
          created_by: address.toLowerCase(),
          created_at: new Date().toISOString()
        }]).select().single()
        if (error) console.error("Error creating room:", error)
        if (data) navigate(`/room/${data.id}`)
      } else {
        const id = await createLocalRoom(name, members, address)
        navigate(`/room/${id}`)
      }
    } catch(e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
      onClose()
    }
  }

  const truncateAddress = (addr: string) => `${addr.slice(0,6)}...${addr.slice(-4)}`

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-[480px] p-[32px] bg-[var(--bg-card)] border border-[var(--border-bright)] rounded-[20px] shadow-2xl z-10 mx-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-display font-semibold mb-6 text-white">Create Split Room</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Room Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekend Trip" className="w-full" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-white/80">
                  Members <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded-full text-xs">{members.length}</span>
                </label>
                
                <div className="flex gap-3 relative">
                  <div className="w-full relative">
                    <Input 
                      value={newMember} 
                      onChange={e => { setNewMember(e.target.value); setMemberError(''); }} 
                      placeholder="Paste wallet address 0x..." 
                      className="w-full font-mono"
                    />
                    {memberError && <div className="absolute -bottom-5 text-red-500 text-[11px] font-medium">{memberError}</div>}
                  </div>
                  <Button variant="ghost" type="button" onClick={handleAddMember} className="shrink-0 bg-white/5 border border-white/10 hover:bg-white/10" disabled={!newMember}>
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-7 max-h-40 overflow-y-auto">
                  {members.map(m => (
                    <div key={m} className="flex items-center bg-[rgba(99,102,241,0.15)] border border-[var(--border-bright)] rounded-[20px] px-3 py-1 text-[13px] font-mono text-white max-w-full">
                      <span className="truncate">{m.toLowerCase() === address?.toLowerCase() ? `${truncateAddress(m)} (You)` : truncateAddress(m)}</span>
                      {m.toLowerCase() !== address?.toLowerCase() && (
                        <button onClick={() => setMembers(members.filter(x => x !== m))} className="ml-2 text-white/50 hover:text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={handleCreate}
                disabled={!name || members.length < 1 || isSubmitting}
                variant="primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : 'CREATE ROOM'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

