import { Currency } from "@uniswap/sdk-core"
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from "components/BreadcrumbNav"
import Column from "components/Column"
import ChartSection from "components/Pools/PoolDetails/ChartSection/index"
import { PoolDetailsBreadcrumb, PoolDetailsHeader } from "components/Pools/PoolDetails/PoolDetailsHeader"
import { PoolDetailsLink } from "components/Pools/PoolDetails/PoolDetailsLink"
import { PoolDetailsStats } from "components/Pools/PoolDetails/PoolDetailsStats"
import { PoolDetailsStatsButtons } from "components/Pools/PoolDetails/PoolDetailsStatsButtons"
import { PoolDetailsTableTab } from "components/Pools/PoolDetails/PoolDetailsTable"
import { DetailBubble } from "components/Pools/PoolDetails/shared"
import TokenDetailsSkeleton, { Hr, LeftPanel, RightPanel, TokenDetailsLayout, TokenInfoContainer, TokenNameCell } from "components/Pools/PoolDetails/Skeleton"
import { Text } from "components/Text/Text"
import { PoolDataQuery } from "graphql/thegraph/__generated__/types-and-hooks"
import usePoolData from "graphql/thegraph/PoolDataQuery"
import { useCurrency } from "hooks/Tokens"
import { useReducer } from "react"
import { ChevronRight } from "react-feather"
import { useParams } from "react-router-dom"
import styled from "styled-components/macro"
import { BREAKPOINTS } from "theme"
import { unwrappedToken } from "utils/unwrappedToken"



const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
`
const LinksContainer = styled(Column)`
  gap: 16px;
  width: 100%;
`

const TokenDetailsWrapper = styled(Column)`
  gap: 24px;
  padding: 20px;

  @media (max-width: ${BREAKPOINTS.lg}px) and (min-width: ${BREAKPOINTS.sm}px) {
    flex-direction: row;
    flex-wrap: wrap;
    padding: unset;
  }

  @media (max-width: ${BREAKPOINTS.sm}px) {
    padding: unset;
  }
`

const TokenDetailsHeader = styled(Text)`
  width: 100%;
  font-size: 24px;
  font-weight: 485;
  line-height: 32px;
`

export function TDPBreadcrumb({poolAddress, token0, token1, loading}: {poolAddress: string, token0: Currency | null, token1: Currency | null, loading: boolean}) {
  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to='/explore/tokens'>
         Explore <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to='/explore/pools'>
          Pools <ChevronRight size={14} />
      </BreadcrumbNavLink>
      {loading || !poolAddress ? (
        <DetailBubble $width={200} />
      ) : (
        <CurrentPageBreadcrumb address={poolAddress} poolName={`${token0?.symbol} / ${token1?.symbol}`} />
      )}
    </BreadcrumbNavContainer>
  )
}

function getUnwrappedPoolToken(currency0?: Currency | null, currency1?: Currency | null) {
  return currency0 && currency1
    ? [unwrappedToken(currency0), unwrappedToken(currency1)]
    : [undefined, undefined]
}

export default function PoolDetailsPage() {
  const { poolAddress } = useParams<{ poolAddress: string }>()

  const { data: poolData, isLoading } = usePoolData(poolAddress?.toLowerCase() ?? '', 1000)
  const currency0 = useCurrency(poolData?.token0?.id)
  const currency1 = useCurrency(poolData?.token1?.id)

  const [token0, token1] = getUnwrappedPoolToken(currency0, currency1)
  const [isReversed, toggleReversed] = useReducer((x) => !x, false)

  // // address will never be undefined if token is defined; address is checked here to appease typechecker
  // if (poolAddress === undefined || !poolAddress) {
  //   return <InvalidTokenDetails pageChainId={pageChainId} isInvalidAddress={!poolAddress} />
  // }
  

  return (
    <TokenDetailsLayout>
        <>
          <LeftPanel>
          <Column gap="md">
              <Column>
                <PoolDetailsBreadcrumb
                  poolAddress={poolAddress}
                  token0={currency0 ?? undefined}
                  token1={currency1 ?? undefined}
                  loading={isLoading}
                />
                <PoolDetailsHeader
                  poolAddress={poolAddress}
                  token0={currency0 ?? undefined}
                  token1={currency1 ?? undefined}
                  feeTier={poolData?.feeTier}
                  toggleReversed={toggleReversed}
                  loading={isLoading}
                />
              </Column>
              <ChartSection
                currency0={currency0 ?? undefined}
                currency1={currency1 ?? undefined}
                poolId={poolAddress ?? ''}
                // poolData={poolData}
                // loading={isLoading}
                // isReversed={isReversed}
              />
            </Column>
          
          <Hr />
            <PoolDetailsTableTab
              // poolAddress={poolAddress}
              // token0={token0}
              // token1={token1}
              // protocolVersion={poolData?.protocolVersion}
            />
        </LeftPanel>
        <RightPanel>
            <PoolDetailsStatsButtons
              token0={token0}
              token1={token1}
              feeTier={poolData?.feeTier}
              loading={isLoading}
            />
            <PoolDetailsStats poolData={poolData} isReversed={isReversed} loading={isLoading} />

            <TokenDetailsWrapper>
              <TokenDetailsHeader color="white">
                Links
              </TokenDetailsHeader>
              <LinksContainer>
                <PoolDetailsLink
                  address={poolAddress}
                  tokens={[token0, token1]}
                  loading={isLoading}
                />
                <PoolDetailsLink
                  address={token0?.wrapped.address}
                  tokens={[token0]}
                  loading={isLoading}
                />
                <PoolDetailsLink
                  address={token1?.wrapped.address}
                  tokens={[token1]}
                  loading={isLoading}
                />
              </LinksContainer>
            </TokenDetailsWrapper>
        </RightPanel>
        </>
    </TokenDetailsLayout>
  )
}
