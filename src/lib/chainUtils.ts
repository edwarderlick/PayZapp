import { createPublicClient, http, formatUnits } from 'viem'
import { optimismSepolia, avalancheFuji, polygonAmoy, arbitrumSepolia, baseSepolia, sepolia } from 'viem/chains'
import { arcTestnet } from '../config/arcChain'

export const CIRCLE_CHAIN_IDS: Record<string, number> = {
  Arc_Testnet:      5042002,
  Ethereum_Sepolia: 11155111,
  Arbitrum_Sepolia: 421614,
  Base_Sepolia:     84532,
  Optimism_Sepolia: 11155420,
  Avalanche_Fuji:   43113,
  Polygon_Amoy:     80002,
}

export const CHAIN_ID_TO_CIRCLE: Record<number, string> = Object.fromEntries(
  Object.entries(CIRCLE_CHAIN_IDS).map(([k, v]) => [v, k])
)

// CCTP testnet USDC contract per chain
export const USDC_BY_CHAIN_ID: Record<number, `0x${string}`> = {
  5042002:  '0x3600000000000000000000000000000000000000',
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  421614:   '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  84532:    '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  11155420: '0x5fd84259d66Cd46123540766Be93DFE6D43130D9',
  43113:    '0x5425890298aed601595a70AB815c96711a31Bc65',
  80002:    '0x41e94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
}

export const EXPLORER_BY_CHAIN_ID: Record<number, string> = {
  5042002:  'https://testnet.arcscan.app/tx',
  11155111: 'https://sepolia.etherscan.io/tx',
  421614:   'https://sepolia.arbiscan.io/tx',
  84532:    'https://sepolia.basescan.org/tx',
  11155420: 'https://sepolia-optimism.etherscan.io/tx',
  43113:    'https://testnet.snowtrace.io/tx',
  80002:    'https://amoy.polygonscan.com/tx',
}

const VIEM_CHAIN_MAP: Record<number, any> = {
  5042002:  arcTestnet,
  11155111: sepolia,
  421614:   arbitrumSepolia,
  84532:    baseSepolia,
  11155420: optimismSepolia,
  43113:    avalancheFuji,
  80002:    polygonAmoy,
}

const CHAIN_RPCS: Record<number, string> = {
  5042002:  'https://rpc.testnet.arc.network',
  11155111: 'https://ethereum-sepolia-rpc.publicnode.com',
  421614:   'https://sepolia-rollup.arbitrum.io/rpc',
  84532:    'https://sepolia.base.org',
  11155420: 'https://sepolia.optimism.io',
  43113:    'https://api.avax-test.network/ext/bc/C/rpc',
  80002:    'https://rpc-amoy.polygon.technology',
}

const BALANCE_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export async function readUsdcBalance(chainId: number, walletAddress: string): Promise<string> {
  const usdcAddr = USDC_BY_CHAIN_ID[chainId]
  const chain = VIEM_CHAIN_MAP[chainId]
  const rpc = CHAIN_RPCS[chainId]
  if (!usdcAddr || !rpc) return '0.00'
  const client = createPublicClient({ chain, transport: http(rpc) })
  const raw = await client.readContract({
    address: usdcAddr,
    abi: BALANCE_ABI,
    functionName: 'balanceOf',
    args: [walletAddress as `0x${string}`],
  })
  return parseFloat(formatUnits(raw, 6)).toFixed(4)
}

export async function switchToChain(chainId: number): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet found')
  const currentHex = await (window.ethereum as any).request({ method: 'eth_chainId' }) as string
  const current = parseInt(currentHex, 16)
  if (current === chainId) return
  try {
    await (window.ethereum as any).request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + chainId.toString(16) }],
    })
  } catch (err: any) {
    if (err.code === 4902) throw new Error(`Chain not in wallet. Please add it in MetaMask first.`)
    throw err
  }
}
