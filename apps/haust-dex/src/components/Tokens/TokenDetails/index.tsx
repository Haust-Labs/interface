import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { QueryToken } from "api/Token";
import { TokenApi } from "api/types";
import {Chain, CHAIN_NAME_TO_CHAIN_ID, chainIdToBackendName, getTokenDetailsURL} from "api/util";
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import AddressSection from 'components/Tokens/TokenDetails/AddressSection'
import MobileBalanceSummaryFooter from "components/Tokens/TokenDetails/MobileBalanceSummaryFooter";
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import TokenDetailsSkeleton, {
  Hr,
  LeftPanel,
  TokenDetailsLayout,
  TokenInfoContainer,
  TokenNameCell,
  RightPanel,
} from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { UNKNOWN_TOKEN_SYMBOL, useTokenFromActiveNetwork } from 'lib/hooks/useCurrency'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft, ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'

import ChartSection from './ChartSection'
import InvalidTokenDetails from './InvalidTokenDetails'
import { BreadcrumbNavContainer, CurrentPageBreadcrumb } from 'components/BreadcrumbNav';
import { BreadcrumbNavLink } from './BreadcrumbNavLink';
import { Token } from 'graphql';
import { Currency, NativeCurrency } from '@uniswap/sdk-core';
import { ThemedText } from 'theme';
import BalanceSummary from 'components/Tokens/TokenDetails/BalanceSummary'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useScroll } from 'hooks/useScroll';
import { ActivitySection } from './ActivitySection';
import { Flex } from 'components/layout/Flex';
import { Swap } from 'pages/Swap';
import { TokenDescription } from './TokenDescription';
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { SupportedChainId } from 'constants/chains'
import useNativeCurrency from 'lib/hooks/useNativeCurrency';

const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`

function useOnChainToken(address: string | undefined, skip: boolean) {
  const token = useTokenFromActiveNetwork(skip || !address ? undefined : address)

  if (skip || !address || (token && token?.symbol === UNKNOWN_TOKEN_SYMBOL)) {
    return undefined
  } else {
    return token
  }
}

// Selects most relevant token based on data available, preferring native > query > on-chain
// Token will be null if still loading from on-chain, and undefined if unavailable
function useRelevantToken(
  address: string,
  pageChainId: number,
  tokenQueryData: TokenApi | undefined
) {
  const { chainId: activeChainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()
  
  const queryToken = useMemo(() => {
    if (address === NATIVE_CHAIN_ID) return nativeCurrency

    if (tokenQueryData) return new QueryToken(address, chainIdToBackendName(pageChainId), tokenQueryData)
    return undefined
  }, [pageChainId, address, tokenQueryData, nativeCurrency])

  // fetches on-chain token if query data is missing and page chain matches global chain
  const skipOnChainFetch = Boolean(queryToken) || pageChainId !== activeChainId
  const onChainToken = useOnChainToken(address, skipOnChainFetch)

  return useMemo(
    () => ({ token: queryToken ?? onChainToken, didFetchFromChain: !queryToken }),
    [onChainToken, queryToken]
  )
}

type TokenDetailsProps = {
  urlAddress: string
  inputTokenAddress?: string
  chain: Chain
  tokenQuery: TokenApi
  tokenPriceQuery?: any | undefined
}

function TDPSwapComponent({ token }: { token: Currency }) {
  return (
    <Flex gap="$gap12">
      <Swap
        syncTabToUrl={false}
        initialOutputCurrency={token}
      />
    </Flex>
  )
}

export function TDPBreadcrumb({ detailedToken }: { detailedToken?: Currency }) {
  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to='/explore/tokens'>
        <Trans>Explore</Trans> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to='/explore/tokens'>
        <Trans>Tokens</Trans> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      {detailedToken && (
        <ThemedText.BodyPrimary style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
          {detailedToken.symbol}
        </ThemedText.BodyPrimary>
      )}
    </BreadcrumbNavContainer>
  )
}

export default function TokenDetails({
  urlAddress,
  chain,
  tokenQuery,
  tokenPriceQuery,
}: TokenDetailsProps) {
  const { lg: showRightPanel } = useScreenSize()
  const { direction: scrollDirection } = useScroll()

  if (!urlAddress) {
    throw new Error('Invalid token details route: tokenAddress param is undefined')
  }

  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const { token: detailedToken } = useRelevantToken(urlAddress, pageChainId, tokenQuery)

  const navigate = useNavigate()

  // Wrapping navigate in a transition prevents Suspense from unnecessarily showing fallbacks again.
  const [isPending, startTokenTransition] = useTransition()
  const navigateToTokenForChain = useCallback(
    (update: Chain) => {
      if (!urlAddress) return
      startTokenTransition(() => navigate(getTokenDetailsURL({ address: urlAddress, chain: chain.toLowerCase() })))
    },
    [urlAddress, chain, navigate]
  )
  useOnGlobalChainSwitch(navigateToTokenForChain)

  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()

  const [openTokenSafetyModal, setOpenTokenSafetyModal] = useState(false)

  const onResolveSwap = useCallback(
    (value: boolean) => {
      continueSwap?.resolve(value)
      setContinueSwap(undefined)
    },
    [continueSwap, setContinueSwap]
  )
  
  // address will never be undefined if token is defined; address is checked here to appease typechecker
  if (detailedToken === undefined || !urlAddress) {
    return <InvalidTokenDetails pageChainId={pageChainId} isInvalidAddress={!urlAddress} />
  }
  

  return (
    <TokenDetailsLayout>
      {detailedToken && !isPending ? (
        <>
          <LeftPanel>
            <TDPBreadcrumb detailedToken={detailedToken} />
            
          <TokenInfoContainer data-testid="token-info-container">
            <TokenNameCell>
              <CurrencyLogo currency={detailedToken} size="32px" hideL2Icon={false} />

              {detailedToken.name ?? <Trans>Name not found</Trans>}
              <TokenSymbol>{detailedToken.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
            </TokenNameCell>
          </TokenInfoContainer>
          
          <ChartSection token={detailedToken.symbol === 'HAUST' ? '0x2c990daddaf3b760443b512da9f001f721951438' : urlAddress} />

          <StatsSection
            chainId={pageChainId}
            address={urlAddress}
            TVL={+tokenQuery.totalValueLockedUsd!}
            volume24H={+tokenQuery.marketData.volume24H}
            priceHigh52W={+tokenQuery.marketData.priceHigh52W!}
            priceLow52W={+tokenQuery.marketData.priceLow52W!}
          />
          
          <ActivitySection />
        </LeftPanel>
        <RightPanel>
          {showRightPanel && (
            <>
              <TDPSwapComponent token={detailedToken} />
              <BalanceSummary token={detailedToken} />
            </>
          )}
          <TokenDescription currency={detailedToken} />
        </RightPanel>
        </>
      ) : (
        <TokenDetailsSkeleton />
      )}
      
      {detailedToken && <MobileBalanceSummaryFooter token={detailedToken} />}
    </TokenDetailsLayout>
  )
}
