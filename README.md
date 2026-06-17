# PayZapp

A DeFi wallet app built on [Arc Testnet](https://arc.io) — swap stablecoins, bridge assets cross-chain, send USDC, split bills with friends, and track your transaction history.

Built using Circle's CCTP infrastructure and the Arc Testnet, where USDC is the native gas token.

---

## Features

- **Swap** — Trade USDC ↔ cirBTC and other stablecoin pairs via Circle's AppKit on Arc Testnet
- **Bridge** — Cross-chain transfers using Circle's CCTP (Ethereum Sepolia, Arbitrum, Base, Optimism, Avalanche, Polygon)
- **Send** — Transfer USDC to any wallet address on Arc Testnet
- **Split** — Create shared expense rooms, log costs, and settle up with friends
- **Vault** — View unified balances across all supported chains
- **History** — Full transaction history with on-chain explorer links

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Wallet | RainbowKit + wagmi + viem |
| Swap/Bridge | Circle AppKit (`@circle-fin/app-kit`) |
| Chain adapter | `@circle-fin/adapter-viem-v2` |
| Database | Supabase (split rooms + history) |
| Network | Arc Testnet (chainId 5042002) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Arc Testnet added to MetaMask (RPC: `https://rpc.testnet.arc.network`, Chain ID: `5042002`)
- Test USDC from the [Arc Faucet](https://faucet.arc.io)

### Installation

```bash
git clone https://github.com/edwarderlick/PayZapp.git
cd PayZapp
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CIRCLE_KIT_KEY=your_circle_kit_key
```

| Variable | Where to get it |
|---|---|
| `VITE_WALLETCONNECT_PROJECT_ID` | [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | [supabase.com](https://supabase.com) → your project settings |
| `VITE_CIRCLE_KIT_KEY` | [developer.circle.com](https://developer.circle.com) → App Kit |

### Run Locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## Deployment

This app is configured for one-click deployment on Vercel.

1. Fork or clone this repo
2. Import into [Vercel](https://vercel.com)
3. Add the four environment variables in Vercel's project settings
4. Deploy — `vercel.json` handles SPA routing automatically

After deploying, add your Vercel domain to the allowed origins in your WalletConnect project dashboard.

---

## Supported Networks

| Network | Chain ID | Role |
|---|---|---|
| Arc Testnet | 5042002 | Primary (swap, send) |
| Ethereum Sepolia | 11155111 | Bridge |
| Arbitrum Sepolia | 421614 | Bridge |
| Base Sepolia | 84532 | Bridge |
| Optimism Sepolia | 11155420 | Bridge |
| Avalanche Fuji | 43113 | Bridge |
| Polygon Amoy | 80002 | Bridge |

---

## Notes

- This is a testnet app. No real funds are used.
- Swap currently supports **USDC → cirBTC** on Arc Testnet. Other pairs are available but depend on Arc Testnet pool liquidity.
- The split bill feature stores room data in Supabase. Row-level security restricts reads/writes per wallet address.

---

## License

MIT
