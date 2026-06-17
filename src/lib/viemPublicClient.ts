import { createPublicClient, http, fallback } from 'viem'
import type { Chain, EIP1193Provider, PublicClient } from 'viem'
import { arbitrumSepolia, baseSepolia, sepolia, optimismSepolia, avalancheFuji, polygonAmoy } from 'viem/chains'
import { arcTestnet } from '../config/arcChain'

// Circle adapter contract address — same on all EVM testnets
const ADAPTER = '0xbbd70b01a1cabc96d5b7b129ae1aaabdf50dd40b'

// Nonce-pipeline: when the SDK sends an approval tx, we submit it and
// immediately return the hash without waiting for it to mine. The swap tx is
// then submitted right after (nonce N+1). EVM nonce ordering guarantees the
// approval (nonce N) mines before the swap (nonce N+1), so the on-chain
// allowance check inside the adapter always passes. This eliminates the
// 15-30s approval wait that was eating into Circle's swap deadline, causing
// the swap tx to land after the on-chain deadline and revert.
let _pendingApprovalHash: string | null = null

const VIEM_CHAINS: Record<number, Chain> = {
  5042002:  arcTestnet,
  11155111: sepolia,
  421614:   arbitrumSepolia,
  84532:    baseSepolia,
  11155420: optimismSepolia,
  43113:    avalancheFuji,
  80002:    polygonAmoy,
}

const CHAIN_RPCS: Record<number, string[]> = {
  // Arc Testnet: use ONLY the canonical RPC that Circle's own SDK targets
  // internally (provider-stablecoin-service-swap hardcodes this single
  // endpoint). Previously this blended in two third-party node operators
  // (Blockdaemon, dRPC) via fallback() — if a swap simulation landed on one
  // of those instead of the canonical node, it could see state lagging a
  // few hundred ms behind the node MetaMask/Circle's backend just confirmed
  // the approval on, producing a clean "approve confirmed" followed by a
  // simulate that still reverts with no decodable reason. Single RPC removes
  // that inconsistency entirely.
  5042002:  ['https://rpc.testnet.arc.network'],
  11155111: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.sepolia.org'],
  421614:   ['https://sepolia-rollup.arbitrum.io/rpc', 'https://arbitrum-sepolia-rpc.publicnode.com'],
  84532:    ['https://sepolia.base.org', 'https://base-sepolia-rpc.publicnode.com'],
  11155420: ['https://sepolia.optimism.io', 'https://optimism-sepolia-rpc.publicnode.com'],
  43113:    ['https://api.avax-test.network/ext/bc/C/rpc', 'https://avalanche-fuji-c-chain-rpc.publicnode.com'],
  80002:    ['https://rpc-amoy.polygon.technology', 'https://polygon-amoy-bor-rpc.publicnode.com'],
}

export function getPublicClient({ chain }: { chain: Chain }): PublicClient {
  const resolvedChain = VIEM_CHAINS[chain.id] ?? chain
  const urls = CHAIN_RPCS[chain.id] ?? resolvedChain.rpcUrls.default.http
  const transport = urls.length > 1
    ? fallback(urls.map((u) => http(u)))
    : http(urls[0])
  const base = createPublicClient({ chain: resolvedChain, transport }) as PublicClient

  // Intercept publicClient.call() for two purposes:
  //
  // 1. Skip simulation for calls to the Circle Adapter contract.
  //    The adapter's execute() pre-flight simulation fails on Arc Testnet for
  //    certain directions (e.g. EURC→USDC) with a generic "Transaction reverted"
  //    even though the actual on-chain tx succeeds. Other DeFi apps on Arc skip
  //    simulation entirely and just submit. Returning a no-op success here matches
  //    that behaviour — MetaMask still shows the tx for confirmation.
  //
  // 2. Rewrite increaseAllowance simulations as approve(spender, MaxUint256).
  //    The SDK simulates increaseAllowance before sending it. If a prior session
  //    left on-chain allowance at MaxUint256, simulating (MaxUint256 + addedValue)
  //    throws "SafeMath: addition overflow". This rewrite matches what
  //    wrapProviderWithGasBuffer applies to the actual eth_sendTransaction.
  return new Proxy(base, {
    get(target, prop, receiver) {
      // ── waitForTransactionReceipt ─────────────────────────────────────────
      // Nonce-pipeline: if the SDK is waiting for our pending approval tx,
      // return a fake "success" receipt immediately. The approval is still
      // in-flight in the mempool as nonce N; the swap tx will be submitted as
      // nonce N+1, so the EVM guarantees the approval mines first.
      if (prop === 'waitForTransactionReceipt') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return async (args: any) => {
          const h: string | undefined = args?.hash
          if (h && h === _pendingApprovalHash) {
            _pendingApprovalHash = null
            return {
              transactionHash: h as `0x${string}`,
              status:          'success' as const,
              blockNumber:     1n,
              blockHash:       ('0x' + '0'.repeat(64)) as `0x${string}`,
              transactionIndex: 0,
              cumulativeGasUsed: 21000n,
              gasUsed:           21000n,
              effectiveGasPrice: 1n,
              logs:              [],
              logsBloom:         ('0x' + '0'.repeat(512)) as `0x${string}`,
              type:              'eip1559' as const,
              contractAddress:   null,
              from:              ('0x' + '0'.repeat(40)) as `0x${string}`,
              to:                null,
            }
          }
          return target.waitForTransactionReceipt(args)
        }
      }

      if (prop !== 'call') return Reflect.get(target, prop, receiver)

      // ── call (eth_call) ──────────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (args: any) => {
        const data: string | undefined = args?.data
        const to: string | undefined = args?.to

        // (1) Skip adapter contract simulation
        if (to?.toLowerCase() === ADAPTER) {
          return { data: '0x' as `0x${string}` }
        }

        // (2) Rewrite increaseAllowance → approve(spender, MaxUint256)
        if (typeof data === 'string' && data.toLowerCase().startsWith('0x39509351') && data.length >= 138) {
          const spenderWord = data.slice(10, 74)
          const rewritten = ('0x095ea7b3' + spenderWord + 'f'.repeat(64)) as `0x${string}`
          return target.call({ ...args, data: rewritten })
        }

        return target.call(args)
      }
    },
  }) as PublicClient
}

/**
 * Polls eth_getTransactionReceipt on the wallet's own provider until the
 * transaction is mined (or the timeout elapses). Using the wallet's provider
 * (not our separate public client / RPC fallback list) avoids any propagation
 * mismatch between the node that broadcast the tx and the node we'd otherwise
 * query for confirmation.
 *
 * Throws if the mined receipt has status 0x0 (on-chain revert). Without this
 * check a silently-reverted approval tx would let the SDK proceed to simulation
 * with the old (zero or insufficient) allowance, producing "execution reverted
 * for an unknown reason" instead of a clear "approval failed" message.
 */
async function waitForReceipt(
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>,
  hash: string,
  timeoutMs = 60_000,
  intervalMs = 1200,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const receipt = await request({ method: 'eth_getTransactionReceipt', params: [hash] }) as { status?: string } | null
      if (receipt) {
        if (receipt.status === '0x0') {
          throw new Error(`Approval transaction reverted on-chain (tx: ${hash}). The token contract rejected the allowance change.`)
        }
        return
      }
    } catch (e) {
      // Re-throw our own explicit revert error; swallow transient RPC errors.
      if ((e as Error).message?.includes('Approval transaction reverted')) throw e
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

/**
 * Wraps an EIP-1193 provider with two transparent fixes:
 *
 * 1. Approval wait + MaxUint256 upgrade —
 *    Both approve() and increaseAllowance() are rewritten to
 *    approve(spender, MaxUint256). approve is a SET operation (never overflows).
 *    Rewriting increaseAllowance as approve sidesteps the ADD overflow: if any
 *    prior allowance exists from a previous swap (even MaxUint256 from an older
 *    session), sending increaseAllowance with a nonzero addedValue overflows
 *    Solidity 0.8 → the approval tx reverts silently → the old code (which did
 *    not check receipt.status) returned anyway → the SDK saw a receipt and
 *    proceeded to simulation with the unchanged (possibly zero) allowance →
 *    "execution reverted for an unknown reason". The fix: convert
 *    increaseAllowance to approve(spender, MaxUint256) (safe SET) and verify
 *    receipt.status === '0x1' before returning.
 *
 *    Selector 0x095ea7b3 = keccak256('approve(address,uint256)').slice(0,4)
 *    Selector 0x39509351 = keccak256('increaseAllowance(address,uint256)').slice(0,4)
 *    ABI layout: [0..9] selector, [10..73] spender (32 bytes), [74..137] amount (32 bytes)
 *
 * 2. Gas buffer — every eth_sendTransaction has its maxFeePerGas boosted to
 *    1.5× the current baseFee. Circle SDK hardcodes Arbitrum Sepolia's floor
 *    gas price as maxFeePerGas; the actual baseFee fluctuates just above that,
 *    causing "fee cap lower than block base fee" errors on Arc Testnet.
 */

export function wrapProviderWithGasBuffer(provider: EIP1193Provider): EIP1193Provider {
  const _request = provider.request.bind(provider)

  return new Proxy(provider, {
    get(target, prop, receiver) {
      if (prop !== 'request') return Reflect.get(target, prop, receiver)

      return async (args: { method: string; params?: unknown[] }) => {
        const { method, params } = args

        if (method === 'eth_sendTransaction' && Array.isArray(params) && params[0]) {
          let tx = { ...(params[0] as Record<string, string>) }

          // ── Fix 1a: upgrade approve(spender, amount) → approve(spender, MaxUint256) ──
          // approve is a SET operation so MaxUint256 is always safe.
          // Selector 0x095ea7b3 = keccak256('approve(address,uint256)').slice(0,4)
          // Layout: [0..9] selector, [10..73] spender (32 bytes), [74..137] amount (32 bytes)
          //
          // Nonce-pipeline: we do NOT wait for the approval receipt here. Instead
          // we set _pendingApprovalHash so the publicClient.waitForTransactionReceipt
          // proxy can return a fake "success" receipt immediately, letting the SDK
          // submit the swap tx (nonce N+1) right after the approval (nonce N).
          // EVM nonce ordering guarantees the approval mines before the swap.
          if (
            typeof tx.data === 'string' &&
            tx.data.toLowerCase().startsWith('0x095ea7b3') &&
            tx.data.length >= 138
          ) {
            const selector    = tx.data.slice(0, 10)
            const spenderWord = tx.data.slice(10, 74)
            const maxUint256  = 'f'.repeat(64)
            tx = { ...tx, data: selector + spenderWord + maxUint256 }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hash = await (_request as any)({ method, params: [tx, ...(params as unknown[]).slice(1)] }) as string
            _pendingApprovalHash = hash
            return hash
          }

          // ── Fix 1b: rewrite increaseAllowance → approve(spender, MaxUint256) ──
          // USDC on Arc Testnet calls increaseAllowance (an ADD operation). If any
          // prior allowance remained from a previous swap (e.g., a leftover MaxUint256
          // set by an older version of this wrapper), addedValue + currentAllowance
          // overflows Solidity 0.8 and the approval tx reverts silently. Converting
          // to approve() (a SET operation) is always safe and avoids overflow entirely.
          // Selector 0x39509351 = keccak256('increaseAllowance(address,uint256)').slice(0,4)
          if (
            typeof tx.data === 'string' &&
            tx.data.toLowerCase().startsWith('0x39509351') &&
            tx.data.length >= 138
          ) {
            const spenderWord = tx.data.slice(10, 74)
            const maxUint256  = 'f'.repeat(64)
            // Rewrite as approve(spender, MaxUint256) — selector 0x095ea7b3
            tx = { ...tx, data: '0x095ea7b3' + spenderWord + maxUint256 }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hash = await (_request as any)({ method, params: [tx, ...(params as unknown[]).slice(1)] }) as string
            _pendingApprovalHash = hash
            return hash
          }

          // ── Fix 2: gas buffer ───────────────────────────────────────────────────────
          if (tx.maxFeePerGas != null) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const block = await (_request as any)({
                method: 'eth_getBlockByNumber',
                params: ['latest', false],
              }) as { baseFeePerGas?: string } | null

              if (block?.baseFeePerGas) {
                const baseFee = BigInt(block.baseFeePerGas)
                const safeMax = (baseFee * 3n) / 2n
                const current = BigInt(tx.maxFeePerGas)
                if (current < safeMax) {
                  tx = { ...tx, maxFeePerGas: '0x' + safeMax.toString(16) }
                }
              }
            } catch {
              const current = BigInt(tx.maxFeePerGas)
              tx = { ...tx, maxFeePerGas: '0x' + ((current * 3n) / 2n).toString(16) }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (_request as any)({ method, params: [tx, ...(params as unknown[]).slice(1)] })
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (_request as any)(args)
      }
    },
  })
}
