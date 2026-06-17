import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { arbitrumSepolia, baseSepolia, sepolia, optimismSepolia, avalancheFuji, polygonAmoy } from 'viem/chains'
import { arcTestnet } from './arcChain'

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// A missing project ID doesn't fail loudly — RainbowKit/WalletConnect just
// silently breaks every non-injected wallet connection (mobile wallets, QR
// code pairing, anything that isn't a directly-injected extension like
// MetaMask). For public users on phones this is the majority connection
// path, so warn clearly instead of letting 'demo' fail mysteriously.
if (!walletConnectProjectId) {
  // eslint-disable-next-line no-console
  console.error(
    '[PayZapp] VITE_WALLETCONNECT_PROJECT_ID is not set. WalletConnect-based ' +
    'connections (mobile wallets, QR pairing) will not work. Get a free project ' +
    'ID at https://cloud.walletconnect.com and set it in your Vercel env vars.'
  )
}

export const wagmiConfig = getDefaultConfig({
  appName: 'PayZapp',
  projectId: walletConnectProjectId || 'demo',
  chains: [arcTestnet, arbitrumSepolia, sepolia, baseSepolia, optimismSepolia, avalancheFuji, polygonAmoy],
  ssr: false,
})
