import { NetworkStatus } from '@apollo/client'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import {Chain} from "api/util";
import { useTokenSpotPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName, isGqlSupportedChain, PollingInterval } from 'graphql/data/util'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

import useStablecoinPrice from './useStablecoinPrice'

export function useUSDPrice(currencyAmount?: CurrencyAmount<Currency>): {
  data: number | undefined
  isLoading: boolean
} {
  const chain = currencyAmount?.currency.chainId ? chainIdToBackendName(currencyAmount?.currency.chainId) : undefined
  const currency = currencyAmount?.currency

  const { data, networkStatus } = useTokenSpotPriceQuery({
    // @ts-ignore
    variables: { chain: chain ?? Chain.HAUST, address: getNativeTokenDBAddress(chain ?? Chain.HAUST) },
    skip: !chain || !isGqlSupportedChain(currency?.chainId),
    pollInterval: PollingInterval.Normal,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-first',
  })

  // Use USDC price for chains not supported by backend yet
  const stablecoinPrice = useStablecoinPrice(!isGqlSupportedChain(currency?.chainId) ? currency : undefined)
  if (!isGqlSupportedChain(currency?.chainId) && currencyAmount && stablecoinPrice) {
    return { data: parseFloat(stablecoinPrice.quote(currencyAmount).toSignificant()), isLoading: false }
  }

  const isFirstLoad = networkStatus === NetworkStatus.loading

  // Otherwise, get the price of the token in ETH, and then multiple by the price of ETH
  const ethUSDPrice = data?.token?.project?.markets?.[0]?.price?.value
  if (!ethUSDPrice) return { data: undefined, isLoading: isFirstLoad }

  return { data: ethUSDPrice, isLoading: false }
}
