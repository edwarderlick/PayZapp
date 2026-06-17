import './lib/circleProxy'
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@rainbow-me/rainbowkit/styles.css'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { wagmiConfig } from './config/wagmi'
import { SolanaWalletProvider } from './config/solanaWallet'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

const RAINBOWKIT_DARK = darkTheme({ accentColor: '#00d4ff', accentColorForeground: '#060612' })
const RAINBOWKIT_LIGHT = lightTheme({ accentColor: '#00A882', accentColorForeground: '#ffffff' })

// RainbowKit's connect/account modal needs its own theme object — it can't
// read our CSS variables. Without this, the wallet modal stayed dark even
// when the app was switched to light mode, a jarring inconsistency.
function ThemedRainbowKitProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <RainbowKitProvider theme={theme === 'dark' ? RAINBOWKIT_DARK : RAINBOWKIT_LIGHT}>
      {children}
    </RainbowKitProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SolanaWalletProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <ThemeProvider>
                <ThemedRainbowKitProvider>
                  <App />
                  <Toaster position="bottom-right" />
                </ThemedRainbowKitProvider>
              </ThemeProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </WagmiProvider>
      </SolanaWalletProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
