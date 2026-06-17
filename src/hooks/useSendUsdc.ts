import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, isAddress } from 'viem'
import { USDC_ADDRESS, ERC20_ABI, USDC_DECIMALS } from '../config/contracts'

export function useSendUsdc() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const send = (to: string, amount: string) => {
    if (!isAddress(to)) throw new Error('Invalid address')
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, parseUnits(amount, USDC_DECIMALS)],
    })
  }

  const explorerUrl = hash
    ? `https://testnet.arcscan.app/tx/${hash}`
    : undefined

  return { send, hash, explorerUrl, isPending, isConfirming, isSuccess, error }
}
