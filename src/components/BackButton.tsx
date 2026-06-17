import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface BackButtonProps {
  onClick: () => void
  label?: string
}

export function BackButton({ onClick, label = "Back" }: BackButtonProps) {
  return (
    <motion.button
      whileHover={{ x: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors duration-300 bg-transparent border-none outline-none mb-6 group cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </motion.button>
  )
}
