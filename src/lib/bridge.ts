import type { EIP1193Provider } from 'viem'
import { getPublicClient, wrapProviderWithGasBuffer } from './viemPublicClient'

function extractBridgeError(result: any): string {
  if (!result) return 'Bridge returned no result'
  const failedStep = result.steps?.find((s: any) => s.state === 'error')
  if (failedStep?.errorMessage) return failedStep.errorMessage
  if (failedStep?.errorCategory) return `Bridge step failed: ${failedStep.errorCategory}`
  return 'Bridge failed — check wallet connection and chain'
}

export async function executeBridge({
  fromChain,
  toChain,
  amount,
  onEvent,
}: {
  fromChain: string
  toChain: string
  amount: string
  onEvent?: (payload: any) => void
}) {
  if (!window.ethereum) {
    throw new Error('No wallet connected. Please connect MetaMask.')
  }

  const { BridgeKit } = await import('@circle-fin/bridge-kit')
  const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2')

  const adapter = await createViemAdapterFromProvider({
    provider: wrapProviderWithGasBuffer(window.ethereum as EIP1193Provider),
    getPublicClient,
  })

  const kit = new BridgeKit()

  if (onEvent) {
    kit.on('*', onEvent)
  }

  let result = await kit.bridge({
    from: { adapter, chain: fromChain as any },
    to: { adapter, chain: toChain as any },
    amount,
  })

  if (result?.state === 'error') {
    try {
      result = await kit.retry(result, { from: adapter, to: adapter })
    } catch {
      // retry itself may throw — fall through to state check below
    }
  }

  if (result?.state === 'error') {
    throw new Error(extractBridgeError(result))
  }

  return result
}
