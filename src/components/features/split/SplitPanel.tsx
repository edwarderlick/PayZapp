import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'
import { Plus, Users } from 'lucide-react'
import { useSplitRooms } from '../../../hooks/useSplitRoom'
import { Card } from '../../ui/Card'
import { Button } from '../../ui/Button'
import { Spinner } from '../../ui/Spinner'
import { CreateRoomModal } from './CreateRoomModal'

export function SplitPanel() {
  const { address } = useAccount()
  const { rooms, isLoading } = useSplitRooms(address)
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-8"
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight uppercase text-white mb-2">
            Split Bills
          </h1>
          <p className="text-[12px] uppercase tracking-[0.25em] text-white/40 font-medium">
            Create rooms to share expenses with friends
          </p>
        </div>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-black text-white cursor-pointer shrink-0"
          style={{
            background: 'linear-gradient(180deg,#00D4AA,#5847d2)',
            boxShadow: '0 0 25px rgba(108,92,231,0.35)',
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          New Room
        </motion.button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : rooms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
          style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-default)',
            borderRadius: '2rem',
          }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
            style={{
              background: 'rgba(108,92,231,0.1)',
              border: '1px solid rgba(198,191,255,0.15)',
              boxShadow: '0 0 30px rgba(108,92,231,0.08)',
            }}
          >
            <Users className="w-8 h-8 text-[#00D4AA]" />
          </div>
          <h3 className="text-[13px] uppercase tracking-[0.2em] font-black mb-4 text-white">No Rooms Yet</h3>
          <p className="text-[11px] text-white/40 leading-relaxed tracking-[0.1em] font-medium max-w-sm mb-10">
            Create a room to start splitting bills and settling debts securely.
          </p>
          <Button variant="neon" onClick={() => setIsModalOpen(true)}>Create First Room</Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
            >
              <Link to={`/room/${room.id}`} className="block h-full">
                <div
                  className="flex flex-col h-full p-7 rounded-[1.5rem] cursor-pointer group transition-all duration-300"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    backdropFilter: 'blur(12px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(108,92,231,0.35)'
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(108,92,231,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = '1px solid var(--border-subtle)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <Users className="w-5 h-5 text-white/70 group-hover:text-[#00D4AA] transition-colors" />
                  </div>

                  {/* Name */}
                  <h3 className="text-base uppercase tracking-[0.18em] font-display font-black mb-2 text-white/90 group-hover:text-[#00D4AA] transition-colors">
                    {room.name}
                  </h3>

                  {/* Members */}
                  <p className="text-[11px] text-[#00D4AA] tracking-[0.12em] uppercase flex items-center gap-2 font-bold mb-auto">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: '#00D4AA', boxShadow: '0 0 8px #00D4AA' }}
                    />
                    {room.members.length} members
                  </p>

                  {/* Footer */}
                  <div
                    className="mt-6 pt-5 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}
                  >
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Open Room</span>
                    <span className="text-[#00D4AA] group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  )
}
