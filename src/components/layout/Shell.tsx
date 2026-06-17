import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { PriceTicker } from './PriceTicker'
import { CommandPalette } from '../ui/CommandPalette'

export function Shell() {
  const { isConnected } = useAccount()
  const [paletteOpen, setPaletteOpen] = useState(false)

  if (!isConnected) {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar onOpenPalette={() => setPaletteOpen(true)} />
      <PriceTicker />
      {/* main is the ONLY scrolling region — the shell above is height-capped
          (not just min-height), so the window/body never scrolls. Without
          this cap, tall page content grew the whole shell past the
          viewport, making the window scroll instead of just `main`; the
          sticky TopBar would then collide with content riding up behind it
          (worse once the wrong-network banner added extra height on top). */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <Outlet />
      </main>
      <MobileNav />
      <CommandPalette
        isOpen={paletteOpen}
        onOpen={() => setPaletteOpen(true)}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  )
}
