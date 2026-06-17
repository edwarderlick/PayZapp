import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

// Cast Solana adapter components to avoid React 19 FC type incompatibility
// (FC return type changed to include Promise<ReactNode> which breaks JSX).
const CP  = ConnectionProvider  as React.ComponentType<{ endpoint: string; children?: React.ReactNode }>
const WP  = WalletProvider      as React.ComponentType<any>
const WMP = WalletModalProvider as React.ComponentType<{ children?: React.ReactNode }>

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], [])

  return (
    <CP endpoint={endpoint}>
      <WP wallets={wallets} autoConnect onError={(err: Error) => console.warn('Solana wallet error:', err)}>
        <WMP>
          {children}
        </WMP>
      </WP>
    </CP>
  )
}
