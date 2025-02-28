import {useTokenApi} from "api/Token";
import {validateUrlChainParam} from "api/util";
import TokenDetails from 'components/Tokens/TokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { TimePeriod, toHistoryDuration } from 'graphql/data/util'
import useTokenData from "graphql/thegraph/TokenDataQuery";
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'
import { LoadedTDPContext, PendingTDPContext, TDPProvider } from "./TDPContext";
import { CHAIN_IDS_TO_NAMES, SupportedChainId } from "constants/chains";
import { WRAPPED_NATIVE_CURRENCY } from "constants/tokens";
import { Token } from "@uniswap/sdk-core";

export const pageTimePeriodAtom = atomWithStorage<TimePeriod>('tokenDetailsTimePeriod', TimePeriod.DAY)

function useCreateTDPContext(): PendingTDPContext | LoadedTDPContext {
  const { tokenAddress, chainName } = useParams<{
    tokenAddress?: string
    chainName?: string
  }>()
  
  const resolvedTokenAddress = tokenAddress === 'NATIVE' 
    ? (WRAPPED_NATIVE_CURRENCY[SupportedChainId.HAUST_TESTNET] as Token).address
    : tokenAddress || (WRAPPED_NATIVE_CURRENCY[SupportedChainId.HAUST_TESTNET] as Token).address

  const currencyChainInfo = chainName

  return useMemo(() => {
    return {
      currencyChain: currencyChainInfo ?? CHAIN_IDS_TO_NAMES[SupportedChainId.HAUST_TESTNET],
      // `currency.address` is checksummed, whereas the `tokenAddress` url param may not be
      address: resolvedTokenAddress,
      isNative: tokenAddress === 'NATIVE' 
    }
  }, [
    currencyChainInfo,
    tokenAddress,
    resolvedTokenAddress,
  ])
}

export default function TokenDetailsPage() {
  const contextValue = useCreateTDPContext()
  const chain = validateUrlChainParam(contextValue.currencyChain)
  const [timePeriod, setTimePeriod] = useAtom(pageTimePeriodAtom)

  const parsedQs = useParsedQueryString()

  const parsedInputTokenAddress: string | undefined = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string' ? (parsedQs.inputCurrency as string) : undefined
  }, [parsedQs])

  const { data: tokenQuery } = useTokenData(contextValue.address, 1000);

  // Saves already-loaded chart data into state to display while tokenPriceQuery is undefined timePeriod input changes
  // const [currentPriceQuery, setCurrentPriceQuery] = useState(tokenPriceQuery)
  // useEffect(() => {
  //   if (tokenPriceQuery) setCurrentPriceQuery(tokenPriceQuery)
  // }, [setCurrentPriceQuery, tokenPriceQuery])

  if (!tokenQuery) {
    return <TokenDetailsPageSkeleton />
  }
  
    return (
      <TDPProvider contextValue={contextValue}>
        <TokenDetails
          urlAddress={contextValue.isNative ? NATIVE_CHAIN_ID : contextValue.address}
          chain={chain}
          tokenQuery={tokenQuery}
          // tokenPriceQuery={currentPriceQuery}
          inputTokenAddress={parsedInputTokenAddress}
        />
      </TDPProvider>
    )
}
