import type { EIP1193Provider } from 'viem'
import { getPublicClient, wrapProviderWithGasBuffer } from './viemPublicClient'

async function getKitAndAdapter() {
  if (!window.ethereum) {
    throw new Error('No wallet connected. Please connect MetaMask or another wallet.')
  }

  const { UnifiedBalanceKit } = await import('@circle-fin/unified-balance-kit')
  const { createViemAdapterFromProvider } = await import('@circle-fin/adapter-viem-v2')

  const adapter = await createViemAdapterFromProvider({
    provider: wrapProviderWithGasBuffer(window.ethereum as EIP1193Provider),
    getPublicClient,
  })

  const kit = new UnifiedBalanceKit()
  return { kit, adapter }
}

export async function depositToUnifiedBalance({
  fromChain,
  amount,
  onEvent,
}: {
  fromChain: string
  amount: string
  onEvent?: (event: any) => void
}) {
  const { kit, adapter } = await getKitAndAdapter()

  if (onEvent) kit.on('*', onEvent)

  return kit.deposit({
    from: { adapter, chain: fromChain as any },
    amount,
    token: 'USDC',
  })
}

export async function spendFromUnifiedBalance({
  toChain,
  recipientAddress,
  amount,
  onEvent,
}: {
  toChain: string
  recipientAddress: string
  amount: string
  onEvent?: (event: any) => void
}) {
  const { kit, adapter } = await getKitAndAdapter()

  if (onEvent) kit.on('*', onEvent)

  return kit.spend({
    amount,
    from: { adapter },
    to: {
      adapter,
      chain: toChain as any,
      recipientAddress,
    },
  })
}
