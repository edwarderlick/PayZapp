import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Send, Users, ArrowRightLeft, Layers, Shield, Globe, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { PayZappLogo } from '../../ui/PayZappLogo'

function ParticleField() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8,
    size: 1 + Math.random() * 2,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '0%',
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0 ? '#00D4AA' : p.id % 3 === 1 ? '#00D4AA' : '#5B67F3',
          }}
          animate={{
            y: [0, -window.innerHeight * 0.8],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

const STATS = [
  { value: '<1s', label: 'Settlement Time' },
  { value: '7', label: 'Chains Supported' },
  { value: 'CCTP v2', label: 'Bridge Protocol' },
  { value: 'Zero', label: 'Bridge Fees' },
]

const FEATURES = [
  {
    icon: Send,
    color: '#00D4AA',
    glow: 'rgba(108,92,231,0.3)',
    border: 'rgba(198,191,255,0.2)',
    title: 'Instant Send',
    badge: 'SUB-SECOND',
    desc: 'Send USDC in under 1 second to any wallet address or ENS name. True sub-second settlement on Arc Layer.',
  },
  {
    icon: Users,
    color: '#00D4AA',
    glow: 'rgba(70,234,229,0.25)',
    border: 'rgba(70,234,229,0.2)',
    title: 'Room Split',
    badge: 'SOCIAL',
    desc: 'Create group spending rooms. Track shared expenses, calculate splits automatically, and settle in one click.',
  },
  {
    icon: ArrowRightLeft,
    color: '#5B67F3',
    glow: 'rgba(162,155,254,0.25)',
    border: 'rgba(162,155,254,0.2)',
    title: 'Smart Swap',
    badge: 'V4 ROUTER',
    desc: 'Swap stablecoins with optimized routing. Multi-hop path finding for best rates across Arc liquidity pools.',
  },
  {
    icon: Layers,
    color: '#00cec9',
    glow: 'rgba(0,206,201,0.25)',
    border: 'rgba(0,206,201,0.2)',
    title: 'CCTP Bridge',
    badge: 'CIRCLE',
    desc: 'Cross-chain USDC transfers via official Circle CCTP rails. No wrapped tokens, no centralized escrow.',
  },
  {
    icon: Shield,
    color: '#f0b429',
    glow: 'rgba(240,180,41,0.25)',
    border: 'rgba(240,180,41,0.2)',
    title: 'Gateway Vault',
    badge: 'CIRCLE API',
    desc: 'One unified balance across all chains. Deposit from any chain, spend anywhere instantly via Circle Gateway.',
  },
  {
    icon: Globe,
    color: '#ff6b9d',
    glow: 'rgba(255,107,157,0.25)',
    border: 'rgba(255,107,157,0.2)',
    title: 'History Ledger',
    badge: 'FULL TRACE',
    desc: 'Complete on-chain transaction history. Filter by type, view explorer links, track all your DeFi activity.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 70, damping: 18 } }
}

export function LandingPage() {
  return (
    <div className="min-h-screen text-[var(--text-primary)] flex flex-col font-ui relative overflow-hidden">
      <ParticleField />

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="flex justify-between items-center px-6 md:px-14 py-5 border-b border-white/[0.05] bg-[rgba(6,5,16,0.7)] backdrop-blur-2xl z-50 fixed top-0 w-full">
        <div className="h-[1px] absolute bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-[#00D4AA]/30 to-transparent" />
        <div className="flex items-center gap-3.5 group cursor-pointer">
          <motion.div whileHover={{ rotate: 10, scale: 1.1 }}>
            <PayZappLogo size={40} className="rounded-xl shadow-[0_0_24px_rgba(0,212,170,0.25)]" />
          </motion.div>
          <span className="font-display text-lg tracking-[0.3em] font-bold hidden sm:block gradient-text uppercase">
            PayZapp
          </span>
        </div>
        <ConnectButton />
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6 pt-40 pb-20 z-10 w-full max-w-7xl mx-auto">

        {/* Live Badge */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-10 inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-[#00D4AA]/30 bg-[#00D4AA]/[0.07] backdrop-blur-xl cursor-pointer group hover:border-[#00D4AA]/40 transition-all duration-500"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4AA] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D4AA]" />
          </span>
          <span className="text-[11px] uppercase tracking-[0.35em] text-[#00D4AA] font-bold font-display">
            Arc Layer · DeFi Super-App · Live
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-center max-w-5xl"
        >
          <h1 className="text-[64px] sm:text-[90px] md:text-[120px] leading-[0.9] font-display font-black mb-8 tracking-tight select-none">
            <span className="text-[var(--text-primary)]">Send</span>
            <br />
            <span className="gradient-text italic font-light" style={{ fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'italic' }}>
              Anywhere.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-[var(--text-secondary)] font-light px-4 mb-16">
            Multi-chain DeFi hub — Send, Split, Swap & Bridge seamlessly.
            Built natively on <span className="text-[#00D4AA] font-semibold">Arc Testnet</span> with{' '}
            <span className="text-[#00D4AA] font-semibold">instant USDC settlements</span>.
          </p>

          {/* CTA */}
          <motion.div
            className="flex flex-col items-center gap-5"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-[#00D4AA] via-[#5B67F3] to-[#00cec9] shadow-[0_0_40px_rgba(108,92,231,0.35)] hover:shadow-[0_0_60px_rgba(108,92,231,0.5)] transition-all duration-500">
              <div className="bg-[#060510] rounded-[15px] p-1.5">
                <ConnectButton />
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-number text-[var(--text-muted)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] shadow-[0_0_8px_#00D4AA] animate-pulse" />
              No fees · Non-custodial · Testnet
            </span>
          </motion.div>
        </motion.div>

        {/* ─── Stats Row ────────────────────────────────────── */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24 w-full max-w-3xl"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 p-5 rounded-2xl text-center"
              style={{
                background: 'rgba(22,20,40,0.6)',
                border: '1px solid rgba(146,142,160,0.1)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <span className="text-2xl font-display font-black gradient-text">{stat.value}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ─── Features Grid ───────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-24 w-full"
        >
          {FEATURES.map((feat) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                variants={itemVariants}
                className="group relative p-7 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500"
                style={{
                  background: 'rgba(18,16,32,0.7)',
                  border: `1px solid ${feat.border}`,
                  backdropFilter: 'blur(20px)',
                }}
                whileHover={{
                  y: -4,
                  boxShadow: `0 0 40px ${feat.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
                  borderColor: feat.color + '55',
                }}
              >
                {/* Top shimmer */}
                <div
                  className="absolute top-0 left-0 w-full h-[1px] opacity-60"
                  style={{ background: `linear-gradient(90deg, transparent, ${feat.color}, transparent)` }}
                />

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110"
                  style={{
                    background: `${feat.glow.replace('0.25', '0.12')}`,
                    border: `1px solid ${feat.border}`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: feat.color }} />
                </div>

                {/* Badge */}
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="text-[9px] uppercase tracking-[0.3em] font-display font-bold px-2.5 py-1 rounded-full border"
                    style={{ color: feat.color, borderColor: feat.border, background: `${feat.glow.replace('0.25', '0.08')}` }}
                  >
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-xl font-display font-bold mb-3 text-white group-hover:text-white transition-colors">
                  {feat.title}
                </h3>
                <p className="text-[var(--text-muted)] leading-relaxed text-sm">
                  {feat.desc}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="mt-10 p-8 md:px-14 border-t border-white/[0.05] bg-[rgba(6,5,16,0.6)] backdrop-blur-xl text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] flex flex-col md:flex-row justify-between items-center gap-6 z-10 w-full">
        <span className="font-number font-light tracking-widest">
          PayZapp · 2026 · Built on Arc Testnet
        </span>
        <div className="flex gap-8 font-bold">
          <a href="https://testnet.arcscan.app" className="hover:text-[#00D4AA] transition-colors" target="_blank" rel="noopener noreferrer">ArcScan</a>
          <a href="https://faucet.circle.com"    className="hover:text-[#00D4AA] transition-colors" target="_blank" rel="noopener noreferrer">Faucet</a>
          <a href="https://docs.arc.io"          className="hover:text-[#00D4AA] transition-colors" target="_blank" rel="noopener noreferrer">Arc Docs</a>
        </div>
      </footer>
    </div>
  )
}
