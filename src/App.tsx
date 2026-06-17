import { Routes, Route, Navigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { LandingPage } from './components/features/landing/LandingPage'
import { Shell } from './components/layout/Shell'
import { SplitRoomPage } from './pages/SplitRoomPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { UnifiedHubPanel } from './components/features/hub/UnifiedHubPanel'
import { SplitPanel } from './components/features/split/SplitPanel'
import { UnifiedBalancePanel } from './components/features/vault/UnifiedBalancePanel'
import { HistoryPanel } from './components/features/history/HistoryPanel'

export default function App() {
  const { isConnected } = useAccount()

  return (
    <Routes>
      <Route path="/" element={isConnected ? <Navigate to="/send" replace /> : <LandingPage />} />
      <Route element={<Shell />}>
        <Route path="/send" element={<UnifiedHubPanel />} />
        <Route path="/split" element={<SplitPanel />} />
        <Route path="/swap" element={<UnifiedHubPanel />} />
        <Route path="/bridge" element={<UnifiedHubPanel />} />
        <Route path="/vault" element={<UnifiedBalancePanel />} />
        <Route path="/history" element={<HistoryPanel />} />
      </Route>
      <Route path="/room/:id" element={<SplitRoomPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
