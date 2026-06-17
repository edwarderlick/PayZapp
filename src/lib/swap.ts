import type { EIP1193Provider } from 'viem'
import { getPublicClient, wrapProviderWithGasBuffer } from './viemPublicClient'

export async function executeSwap({
  tokenIn,
  tokenOut,
  amountIn,
  kitKey,
}: {
  tokenIn: string
  tokenOut: string
  amountIn: string
  kitKey: string
}) {
  if (!window.ethereum) {
    throw new Error('No wallet connected. Please connect MetaMask or another wallet.')
  }

  // Use AppKit (the official unified kit shown in Arc's documentation) rather
  // than the standalone SwapKit. Both route through the same Circle API but
  // AppKit is the recommended entry-point for all Arc operations.
  const { AppKit } = await import('@circle-fin/app-kit')
  const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2')

  const adapter = await createViemAdapterFromProvider({
    provider: wrapProviderWithGasBuffer(window.ethereum as EIP1193Provider),
    getPublicClient,
  })

  const kit = new AppKit()

  // Force on-chain approval instead of the EIP-712 permit flow.
  // Arc Testnet's USDC uses increaseAllowance (an ADD operation). The
  // wrapProviderWithGasBuffer interceptor waits for it to mine before
  // returning so the Circle adapter's pre-flight simulation always sees the
  // updated allowance. Without this wait the simulation runs with zero
  // allowance and reverts with no decodable reason.
  const swapParams = {
    from: {
      adapter,
      chain: 'Arc_Testnet' as const,
    },
    tokenIn,
    tokenOut,
    amountIn,
    config: {
      kitKey,
      allowanceStrategy: 'approve' as const,
      // Arc Testnet pools have drifted from Circle's quoted price, causing the
      // adapter's on-chain InsufficientAmountOut check to fail with a tight
      // minTokenOut. 5% slippage tolerance covers the pool drift for all pairs.
      slippageBps: 500,
    },
  }

  try {
    const estimate = await kit.estimateSwap(swapParams)
    // eslint-disable-next-line no-console
    console.info('[PayZapp] swap estimate', estimate)
  } catch (estimateErr) {
    // eslint-disable-next-line no-console
    console.warn('[PayZapp] estimateSwap failed', estimateErr)
  }

  let result: unknown
  try {
    result = await kit.swap(swapParams)
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[PayZapp] swap failed', err, err?.cause)
    // Log tx hash + explorer link so the revert reason can be checked on-chain
    // eslint-disable-next-line no-console
    try {
      const txHash = err?.cause?.trace?.txHash ?? err?.txHash
      const explorerUrl = err?.cause?.trace?.explorerUrl ?? err?.explorerUrl
      if (txHash) console.error('[PayZapp] failed tx:', txHash, explorerUrl ?? '')
    } catch { /* ignore */ }

    const msg: string = err?.message ?? String(err)
    const lower = msg.toLowerCase()

    if (lower.includes('user rejected') || lower.includes('user denied') || lower.includes('rejected the request')) {
      throw new Error('Swap cancelled.')
    }

    if (lower.includes('no route') || lower.includes('route or resource not found') || lower.includes('createswap failed')) {
      throw new Error(`No swap route available for ${tokenIn} → ${tokenOut} on Arc Testnet.`)
    }

    if (lower.includes('deadline') || lower.includes('expired') || lower.includes('0x1ab7da6b')) {
      throw new Error(`Swap request expired. Please try again.`)
    }

    if (lower.includes('insufficient funds') || lower.includes('insufficient balance')) {
      throw new Error(`Insufficient ${tokenIn} balance.`)
    }

    if (lower.includes('simulation failed') || lower.includes('execution reverted') || lower.includes('transaction reverted')) {
      throw new Error(
        `Swap failed on Arc Testnet.\n` +
        `Please check the browser console for details and try again.`
      )
    }

    throw err
  }

  return result
}
