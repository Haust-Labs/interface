import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { QueryToken } from "api/Token";
import { TokenApi } from "api/types";
import {Chain, CHAIN_NAME_TO_CHAIN_ID, chainIdToBackendName, getTokenDetailsURL} from "api/util";
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import AddressSection from 'components/Tokens/TokenDetails/AddressSection'
import { BreadcrumbNavLink } from 'components/Tokens/TokenDetails/BreadcrumbNavLink'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import MobileBalanceSummaryFooter from "components/Tokens/TokenDetails/MobileBalanceSummaryFooter";
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import TokenDetailsSkeleton, {
  LeftPanel,
  TokenDetailsLayout,
  TokenInfoContainer,
  TokenNameCell,
} from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { UNKNOWN_TOKEN_SYMBOL, useTokenFromActiveNetwork } from 'lib/hooks/useCurrency'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'

import { OnChangeTimePeriod } from './ChartSection'
import InvalidTokenDetails from './InvalidTokenDetails'

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
  address: string | undefined,
  pageChainId: number,
  tokenQueryData: TokenApi | undefined
) {
  const { chainId: activeChainId } = useWeb3React()
  const queryToken = useMemo(() => {
    if (!address) return undefined
    if (address === NATIVE_CHAIN_ID) return nativeOnChain(pageChainId)
    if (tokenQueryData) return new QueryToken(address, chainIdToBackendName(pageChainId), tokenQueryData)
    return undefined
  }, [pageChainId, address, tokenQueryData])
  // fetches on-chain token if query data is missing and page chain matches global chain (else fetch won't work)
  const skipOnChainFetch = Boolean(queryToken) || pageChainId !== activeChainId
  const onChainToken = useOnChainToken(address, skipOnChainFetch)

  return useMemo(
    () => ({ token: queryToken ?? onChainToken, didFetchFromChain: !queryToken }),
    [onChainToken, queryToken]
  )
}

type TokenDetailsProps = {
  urlAddress: string | undefined
  inputTokenAddress?: string
  chain: Chain
  tokenQuery: TokenApi
  tokenPriceQuery: any | undefined
  onChangeTimePeriod: OnChangeTimePeriod
}
export default function TokenDetails({
  urlAddress,
  chain,
  tokenQuery,
  tokenPriceQuery,
  onChangeTimePeriod,
}: TokenDetailsProps) {
  if (!urlAddress) {
    throw new Error('Invalid token details route: tokenAddress param is undefined')
  }
  const address = useMemo(
    () => (urlAddress === NATIVE_CHAIN_ID ? urlAddress : isAddress(urlAddress) || undefined),
    [urlAddress]
  )

  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const { token: detailedToken } = useRelevantToken(address, pageChainId, tokenQuery)

  const navigate = useNavigate()

  // Wrapping navigate in a transition prevents Suspense from unnecessarily showing fallbacks again.
  const [isPending, startTokenTransition] = useTransition()
  const navigateToTokenForChain = useCallback(
    (update: Chain) => {
      if (!address) return
      startTokenTransition(() => navigate(getTokenDetailsURL({ address, chain })))
    },
    [address, chain, navigate]
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
  if (detailedToken === undefined || !address) {
    return <InvalidTokenDetails pageChainId={pageChainId} isInvalidAddress={!address} />
  }
  return (
    <TokenDetailsLayout>
      {detailedToken && !isPending ? (
        <LeftPanel>
          <BreadcrumbNavLink to="/tokens">
            <ArrowLeft data-testid="token-details-return-button" size={14} /> Tokens
          </BreadcrumbNavLink>
          <TokenInfoContainer data-testid="token-info-container">
            <TokenNameCell>
              <CurrencyLogo currency={detailedToken} size="32px" hideL2Icon={false} />

              {detailedToken.name ?? <Trans>Name not found</Trans>}
              <TokenSymbol>{detailedToken.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
            </TokenNameCell>
            <TokenActions>
              <ShareButton />
            </TokenActions>
          </TokenInfoContainer>
          <ChartSection tokenPriceQuery={tokenPriceQuery} onChangeTimePeriod={onChangeTimePeriod} />

          <StatsSection
            chainId={pageChainId}
            address={address}
            TVL={+tokenQuery.totalValueLockedUsd!}
            volume24H={+tokenQuery.marketData.volume24H}
            priceHigh52W={+tokenQuery.marketData.priceHigh52W!}
            priceLow52W={+tokenQuery.marketData.priceLow52W!}
          />
          {!detailedToken.isNative && <AddressSection address={address} />}
        </LeftPanel>
      ) : (
        <TokenDetailsSkeleton />
      )}
      {detailedToken && <MobileBalanceSummaryFooter token={detailedToken} />}

      <TokenSafetyModal
        isOpen={openTokenSafetyModal || !!continueSwap}
        tokenAddress={address}
        onContinue={() => onResolveSwap(true)}
        onBlocked={() => {
          setOpenTokenSafetyModal(false)
        }}
        onCancel={() => onResolveSwap(false)}
        showCancel={true}
      />
    </TokenDetailsLayout>
  )
}
