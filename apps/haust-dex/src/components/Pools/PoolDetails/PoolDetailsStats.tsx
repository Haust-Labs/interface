import Column from "components/Column"
import Row from "components/Row"
import { Text } from "components/Text/Text"
import styled, { css, useTheme } from "styled-components/macro"
import { BREAKPOINTS, ClickableStyle, ThemedText } from "theme"
import { LoadingBubble } from "../loading"
import { getTokenDetailsURL } from "api/util"
import CurrencyLogo from "components/Logo/CurrencyLogo"
import { useScreenSize } from "hooks/useScreenSize"
import { unwrappedToken } from "utils/unwrappedToken"
import { NATIVE_CHAIN_ID } from "constants/tokens"
import { formatNumber, NumberType } from "conedison/format"
import { Currency } from "@uniswap/sdk-core"
import { ReactNode, useMemo } from "react"
import { DeltaArrow } from "components/Tokens/Delta"
import { formatDelta } from "./PriceChart"
import { DetailBubble } from "./shared"
import { useCurrency } from "hooks/Tokens"
import { ProcessedPoolData } from "graphql/thegraph/PoolDataQuery"
import { Link } from "react-router-dom"

const HeaderText = styled(Text)`
  font-weight: 485;
  font-size: 24px;
  line-height: 36px;
  color: ${({ theme }) => theme.textPrimary} !important;
  @media (max-width: ${BREAKPOINTS.lg}px) {
    width: 100%;
  }
`

const StatsWrapper = styled(Column)<{ loaded?: boolean }>`
  gap: 24px;
  padding: 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.backgroundInteractive};
  width: 100%;
  z-index: 1;
  margin-top: ${({ loaded }) => loaded && '-24px'};

  @media (max-width: ${BREAKPOINTS.lg}px) {
    flex-direction: row;
    background: transparent;
    flex-wrap: wrap;
    padding: 20px 0px;
    justify-content: space-between;
    margin-top: 0px;
  }
`

const StatItemColumn = styled(Column)`
  gap: 8px;
  flex: 1;
  min-width: 180px;

  @media (max-width: ${BREAKPOINTS.sm}px) {
    min-width: 150px;
  }
`

const PoolBalanceSymbols = styled(Row)`
  justify-content: space-between;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    flex-direction: column;
  }
`

const PoolBalanceTokenNamesContainer = styled(Row)`
  font-weight: 485;
  font-size: 16px;
  line-height: 24px;
  width: max-content;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    font-size: 20px;
    line-height: 28px;
    width: 100%;
  }
`

const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.white};
  ${ClickableStyle}
`

const leftBarChartStyles = css`
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  border-right: 1px solid ${({ theme }) => theme.neutralBorder};
`

const rightBarChartStyles = css`
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border-left: 1px solid ${({ theme }) => theme.neutralBorder};
`

const BalanceChartSide = styled.div<{ percent: number; $color: string; isLeft: boolean }>`
  height: 8px;
  width: ${({ percent }) => percent * 100}%;
  background: ${({ $color }) => $color};
  ${({ isLeft }) => (isLeft ? leftBarChartStyles : rightBarChartStyles)}
`

const StatSectionBubble = styled(LoadingBubble)`
  width: 180px;
  height: 40px;
`

const StatHeaderBubble = styled(LoadingBubble)`
  width: 116px;
  height: 24px;
  border-radius: 8px;
`

type TokenFullData = {
  price: number
  tvl: number
  percent: number
  currency?: Currency
}

const PoolBalanceTokenNames = ({ token }: { token: TokenFullData }) => {
  const isScreenSize = useScreenSize()
  const screenIsNotLarge = isScreenSize['lg']

  return (
    <PoolBalanceTokenNamesContainer>
      {!screenIsNotLarge && <CurrencyLogo currency={token.currency} size='20px' style={{ marginRight: '8px' }} />}
      {formatNumber(token.tvl, NumberType.TokenTx)}
      &nbsp;
      <StyledLink
        to={getTokenDetailsURL({
          address: token.currency?.wrapped.address,
        })}
      >
        {token.currency?.wrapped.symbol}
      </StyledLink>
    </PoolBalanceTokenNamesContainer>
  )
}

interface PoolDetailsStatsProps {
  poolData?: ProcessedPoolData  
  isReversed?: boolean
  loading?: boolean
}

export function PoolDetailsStats({ poolData, isReversed, loading }: PoolDetailsStatsProps) {
  const isScreenSize = useScreenSize()
  const screenIsNotLarge = isScreenSize['lg']
  const theme = useTheme()

  const currency0 = useCurrency(poolData?.token0?.id)
  const currency1 = useCurrency(poolData?.token1?.id)

  const [token0, token1] = useMemo(() => {
    if (poolData && poolData.tvlToken0 && poolData.token0Price && poolData.tvlToken1 && poolData.token1Price) {
      const fullWidth = poolData?.tvlToken0 * poolData?.token0Price + poolData?.tvlToken1 * poolData?.token1Price
      const token0FullData: TokenFullData = {
        ...poolData?.token0,
        price: poolData?.token0Price,
        tvl: poolData?.tvlToken0,
        percent: (poolData?.tvlToken0 * poolData?.token0Price) / fullWidth,
        currency: currency0 ?? undefined,
      }
      const token1FullData: TokenFullData = {
        ...poolData?.token1,
        price: poolData?.token1Price,
        tvl: poolData?.tvlToken1,
        percent: (poolData?.tvlToken1 * poolData?.token1Price) / fullWidth,
        currency: currency1 ?? undefined,
      }
      return isReversed ? [token1FullData, token0FullData] : [token0FullData, token1FullData]
    } else {
      return [undefined, undefined]
    }
  }, [currency0, currency1, isReversed, poolData])

  if (loading || !token0 || !token1 || !poolData) {
    return (
      <StatsWrapper>
        <HeaderText>
          <StatHeaderBubble />
        </HeaderText>
        {Array.from({ length: 4 }).map((_, i) => (
          <Column gap="md" key={`loading-info-row-${i}`}>
            <DetailBubble />
            <StatSectionBubble />
          </Column>
        ))}
      </StatsWrapper>
    )
  }

  return (
    <StatsWrapper loaded>
      <HeaderText>
        Stats
      </HeaderText>
      <StatItemColumn>
        <ThemedText.BodySecondary>
          Pool balances
        </ThemedText.BodySecondary>
        <PoolBalanceSymbols>
          <PoolBalanceTokenNames token={token0} />
          <PoolBalanceTokenNames token={token1} />
        </PoolBalanceSymbols>
        {screenIsNotLarge && (
          <Row data-testid="pool-balance-chart">
            <BalanceChartSide percent={token0.percent} $color={theme.accentWarning} isLeft={true} />
            <BalanceChartSide percent={token1.percent} $color={theme.accentAction} isLeft={false} />
          </Row>
        )}
      </StatItemColumn>
      {poolData?.tvlUSD && (
        <StatItem
          title='TVL'
          value={poolData.tvlUSD}
          delta={poolData.tvlUSDChange}
        />
      )}
      {poolData?.volumeUSD24H !== undefined && (
        <StatItem
          title='24H volume'
          value={poolData.volumeUSD24H}
          delta={poolData.volumeUSD24HChange}
        />
      )}
      {poolData?.volumeUSD24H !== undefined && poolData?.feeTier !== undefined && (
        <StatItem
          title='24H fees'
          value={poolData.volumeUSD24H * (poolData.feeTier / 1000000)}
        />
      )}
    </StatsWrapper>
  )
}

const StatsTextContainer = styled(Row)`
  gap: 4px;
  width: 100%;
  align-items: flex-end;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    flex-direction: column;
    gap: 0px;
    align-items: flex-start;
  }
`

const StatItemText = styled(Text)`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 36px;
  font-weight: 485;
  line-height: 44px;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    font-size: 20px;
    line-height: 28px;
  }
`

function StatItem({ title, value, delta }: { title: ReactNode; value: number; delta?: number }) {
  return (
    <StatItemColumn>
      <ThemedText.BodySecondary>{title}</ThemedText.BodySecondary>
      <StatsTextContainer>
        <StatItemText color="textPrimary">
            {formatNumber(value, NumberType.FiatTokenStats)}
        </StatItemText>
        {!!delta && (
          <Row width="max-content" padding="4px 0px">
            <DeltaArrow delta={delta} />
            <ThemedText.BodySecondary>{formatDelta(delta)}</ThemedText.BodySecondary>
          </Row>
        )}
      </StatsTextContainer>
    </StatItemColumn>
  )
}
