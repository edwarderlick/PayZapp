import { useState } from 'react'
import { TopBar } from '../components/layout/TopBar'
import { RoomView } from '../components/features/split/RoomView'
import { CommandPalette } from '../components/ui/CommandPalette'

// Accessible without authentication initially (read-only view for visitors)
// RoomView will handle prompting for connection inside if actions are needed
export function SplitRoomPage() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-bgBase flex flex-col">
      <TopBar onOpenPalette={() => setPaletteOpen(true)} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <RoomView />
      </main>
      <CommandPalette
        isOpen={paletteOpen}
        onOpen={() => setPaletteOpen(true)}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  )
}
