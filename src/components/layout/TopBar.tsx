import { useState } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence } from 'framer-motion'
import { useUsdcBalance } from '../../hooks/useUsdcBalance'
import { AlertTriangle, LayoutDashboard, Send, Users, ArrowRightLeft, Layers, History } from 'lucide-react'
import { NavLink, Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { WalletPanel } from './WalletPanel'
import { TokenLogo } from '../ui/TokenLogo'
import { ChainLogo } from '../ui/ChainLogo'
import { WalletAvatar } from '../ui/WalletAvatar'
import { CommandPaletteHint } from '../ui/CommandPalette'
import { PayZappLogo } from '../ui/PayZappLogo'

const NAV_LINKS = [
  { path: '/send',    label: 'Send',    Icon: Send },
  { path: '/split',   label: 'Split',   Icon: Users },
  { path: '/swap',    label: 'Swap',    Icon: ArrowRightLeft },
  { path: '/bridge',  label: 'Bridge',  Icon: Layers },
  { path: '/vault',   label: 'Vault',   Icon: LayoutDashboard },
  { path: '/history', label: 'History', Icon: History },
]

export function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { formatted: balance } = useUsdcBalance(address)
  const [walletOpen, setWalletOpen] = useState(false)

  const isWrongNetwork = isConnected && chainId !== 5042002
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Wrong network banner */}
      <AnimatePresence>
        {isWrongNetwork && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-amber-500/10 border-b border-amber-500/20"
          >
            <div className="flex items-center justify-center gap-4 py-2.5 text-sm font-medium text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Switch to Arc Testnet to use PayZapp</span>
              <button
                onClick={() => switchChain?.({ chainId: 5042002 })}
                aria-label="Switch to Arc Testnet"
                className="px-4 py-1.5 bg-amber-500 text-black rounded-lg font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer"
              >
                Switch Network
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main bar */}
      <div
        className="flex items-center justify-between px-6 py-0 h-16 max-w-screen-2xl mx-auto"
        style={{
          background: 'var(--bg-header)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {/* Logo */}
        <Link to="/send" className="flex items-center gap-2.5 shrink-0 group">
          <PayZappLogo size={32} className="rounded-xl shadow-[0_0_16px_rgba(0,212,170,0.25)]" />
          <span className="hidden sm:block font-ui font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
            PayZapp
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => clsx(
                'relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 font-ui',
                isActive ? '' : 'hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              )}
              style={({ isActive }) => ({ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' })}
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl -z-10"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2.5 shrink-0">
          <CommandPaletteHint onClick={onOpenPalette} />

          {/* Network pill */}
          {isConnected && !isWrongNetwork && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.18)' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00D4AA' }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#00D4AA' }} />
              </span>
              <ChainLogo chainId="Arc_Testnet" size={14} />
              <span className="text-[10px] font-ui font-semibold" style={{ color: '#00D4AA' }}>Arc Testnet</span>
            </motion.div>
          )}

          {/* USDC balance */}
          <AnimatePresence>
            {isConnected && !isWrongNetwork && balance && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 8 }}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-default"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <TokenLogo symbol="USDC" size={18} />
                <span className="font-number font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{balance}</span>
                <span className="text-xs font-ui" style={{ color: 'var(--text-muted)' }}>USDC</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wallet button */}
          {isConnected ? (
            <div className="relative">
              <motion.button
                onClick={() => setWalletOpen((o) => !o)}
                aria-label="Open wallet menu"
                aria-expanded={walletOpen}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all duration-200 font-ui group"
                style={{
                  background: walletOpen ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {address && <WalletAvatar address={address} size={28} />}
                <span className="font-number text-sm font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>{shortAddr}</span>
              </motion.button>

              <WalletPanel isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
            </div>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => {
                if (!mounted) return null
                return (
                  <motion.button
                    onClick={openConnectModal}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(0,212,170,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 rounded-xl text-sm font-ui font-semibold cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #00D4AA, #00A882)', color: '#0D0E14', boxShadow: '0 4px 20px rgba(0,212,170,0.3)' }}
                  >
                    Connect Wallet
                  </motion.button>
                )
              }}
            </ConnectButton.Custom>
          )}
        </div>
      </div>
    </header>
  )
}
