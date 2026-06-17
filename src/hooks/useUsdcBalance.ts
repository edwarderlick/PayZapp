import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { USDC_ADDRESS, ERC20_ABI, USDC_DECIMALS } from '../config/contracts'

export function useUsdcBalance(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, staleTime: 30_000, gcTime: 60_000, refetchOnWindowFocus: false },
  })

  const formatted = data != null
    ? formatUnits(data as bigint, USDC_DECIMALS)
    : '0.00'

  return { raw: data as (bigint | undefined), formatted, isLoading, refetch }
}
